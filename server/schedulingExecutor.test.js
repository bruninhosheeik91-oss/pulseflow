'use strict';

// Testes do executor server-side de agendamentos (Etapa 3).
// Usam o STORE REAL (disco em pasta temporária) + clock falso + sessão fake +
// envio fake: nenhum WPPConnect real é acionado.

const assert = require('assert');
const { mkdtempSync, existsSync, readFileSync, rmSync } = require('fs');
const os = require('os');
const path = require('path');
const { createSchedulesStore } = require('./schedulingStore.js');
const { createScheduleExecutor } = require('./schedulingExecutor.js');

// ---------------------------------------------------------------- helpers ---

function tempDir() {
  return mkdtempSync(path.join(os.tmpdir(), 'executor-'));
}

function futureIn(clock, ms) {
  return new Date(clock + ms).toISOString();
}

function makeBaseInput(clock, overrides) {
  return Object.assign(
    {
      title: 'Divulgação ofertas do dia',
      sessionId: 'wa_abc123',
      accountName: 'WhatsApp 1',
      destinationId: '1203630294182910@g.us',
      destinationName: 'Ofertas VIP',
      scheduledAt: futureIn(clock, 24 * 3600 * 1000),
      message: 'Confira as ofertas de hoje!',
    },
    overrides || {}
  );
}

// Envio fake: registra chamadas e assume o modo desejado.
function fakeSender(sendCalls, mode) {
  return async (client, destinationId, message) => {
    sendCalls.push({ client, destinationId, message });
    switch (mode) {
      case 'throw':
        throw new Error('rate limit: tente novamente mais tarde');
      case 'hang':
        return new Promise(() => {});
      case 'null':
        return null;
      default:
        return `wa_received_${sendCalls.length}`;
    }
  };
}

// Harness padrão: store real com clock controlado + sessão conectada fake.
function makeHarness(options = {}) {
  const dir = tempDir();
  const clockRef = { value: Date.now() };
  const now = () => clockRef.value;
  const store = createSchedulesStore({
    dataDir: dir,
    now,
    logError: () => {},
  });

  const sendCalls = [];
  const sessions = new Map();
  const connected = options.connected !== false;
  const client = options.client === undefined ? { sendText: () => {} } : options.client;
  if (options.sessionId !== false) {
    sessions.set(options.sessionId || 'wa_abc123', {
      client: connected ? client : null,
      connectionState: connected ? 'connected' : 'disconnected',
      sendOps: 0,
      probeFailures: 0,
    });
  }

  const sendText =
    typeof options.sendText === 'function' ? options.sendText : fakeSender(sendCalls, options.mode);

  const executor = createScheduleExecutor({
    schedulesStore: store,
    getSessionState: (sid) => sessions.get(sid),
    sendText,
    now,
    sendTimeoutMs: options.sendTimeoutMs || 500,
  });

  return { dir, store, now, clockRef, sendCalls, sessions, executor };
}

function flushDisk(dir) {
  const filePath = path.join(dir, 'schedules.json');
  assert.ok(existsSync(filePath), 'schedules.json existe em disco');
  return JSON.parse(readFileSync(filePath, 'utf8')).schedules || [];
}

// ---------------------------------------------------------------- testes ---

function testFutureNotExecuted() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  store.create(makeBaseInput(clockRef.value)); // dentro de 24h, ainda futuro
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 0, 'nada enviado');
    const record = store.list()[0];
    assert.strictEqual(record.status, 'scheduled', 'permanece scheduled');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testDueExecutedFlow() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000; // venceu
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 1, 'enviado 1x');
    assert.strictEqual(harness.sendCalls[0].destinationId, record.destinationId);
    assert.strictEqual(harness.sendCalls[0].message, record.message);
    const after = store.get(record.id);
    assert.strictEqual(after.status, 'executed', 'scheduled -> running -> executed');
    assert.ok(after.executedAt, 'executedAt preenchido');
    assert.ok(after.executionStartedAt, 'executionStartedAt preenchido');
    assert.strictEqual(after.errorMessage, null, 'sem erro');
    assert.strictEqual(after.deliveryUncertain, false, 'sucesso confirmado: false');
    assert.strictEqual(after.sentMessageId, 'wa_received_1', 'sentMessageId persistido');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testSendFailureFails() {
  const harness = makeHarness({ mode: 'throw' });
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 1, 'tentou enviar');
    const after = store.get(record.id);
    assert.strictEqual(after.status, 'failed', 'running -> failed');
    assert.ok(/rate limit/.test(after.errorMessage), 'errorMessage real salvo');
    assert.strictEqual(after.deliveryUncertain, false, 'falha explícita: não é incerta');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testSessionOfflineFailsWithoutSend() {
  // Sessão desconectada (sessionId existe, mas sem cliente conectado).
  const harness = makeHarness({ connected: false });
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 0, 'NÃO chama send com conta offline');
    const after = store.get(record.id);
    assert.strictEqual(after.status, 'failed');
    assert.strictEqual(
      after.errorMessage,
      'Conta WhatsApp indisponível no horário agendado.'
    );
    assert.strictEqual(after.deliveryUncertain, false, 'offline: entrega comprovadamente não ocorreu');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testSessionMissingFailsWithoutSend() {
  // sessionId que não existe no map de sessões (sessão inexistente/desligada).
  const harness = makeHarness({ sessionId: false });
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value, { sessionId: 'ghost' }));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 0, 'NÃO chama send com sessão inexistente');
    const after = store.get(record.id);
    assert.strictEqual(after.status, 'failed');
    assert.strictEqual(
      after.errorMessage,
      'Conta WhatsApp indisponível no horário agendado.'
    );
    assert.strictEqual(after.deliveryUncertain, false, 'sessão inexistente: entrega não ocorreu');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testConcurrentTicksSingleSend() {
  const harness = makeHarness({ mode: 'hang' });
  const { store, clockRef } = harness;
  store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  // Envio pendurado (hang) + timeout: enquanto o 1º ciclo está em andamento,
  // o 2º ciclo é descartado pelo single-flight global.
  const executor = harness.executor;
  return Promise.all([
    executor.runCycle(),
    executor.runCycle(),
  ]).then(() => {
    assert.strictEqual(harness.sendCalls.length, 1, 'apenas 1 envio com ticks simultâneos');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testSameScheduleNotSentTwice() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle()
    .then(() => harness.executor.runCycle())
    .then(() => {
      assert.strictEqual(harness.sendCalls.length, 1, 'ciclos repetidos nunca reenviam');
      assert.strictEqual(store.get(record.id).status, 'executed');
      rmSync(harness.dir, { recursive: true, force: true });
    });
}

function testTwoDueExecutedOnce() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  const first = store.create(makeBaseInput(clockRef.value, { title: 'Primeiro' }));
  clockRef.value += 2 * 3600 * 1000;
  const second = store.create(makeBaseInput(clockRef.value, { title: 'Segundo' }));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 2, 'ambos executam');
    assert.strictEqual(store.get(first.id).status, 'executed');
    assert.strictEqual(store.get(second.id).status, 'executed');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testOrphanedRunningRecoveredOnBoot() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  // Simula processo cair no meio: scheduled -> running, sem execução.
  store.update(record.id, { status: 'running' });
  return store.flush().then(() => {
    // Boot: novo store no mesmo arquivo + recuperação de running órfãos.
    const reloaded = createSchedulesStore({
      dataDir: harness.dir,
      now: () => clockRef.value,
      logError: () => {},
    });
    const recovered = reloaded.recoverOrphanedRunning();
    assert.deepStrictEqual(recovered, [record.id], 'running órfão identificado');
    const after = reloaded.get(record.id);
    assert.strictEqual(after.status, 'failed', 'vira failed');
    assert.strictEqual(
      after.errorMessage,
      'Execução interrompida antes da confirmação. Reenvio manual necessário.'
    );
    assert.strictEqual(after.deliveryUncertain, true, 'running órfão: entrega incerta');
    // E NÃO envia automaticamente.
    const executor = createScheduleExecutor({
      schedulesStore: reloaded,
      getSessionState: () => null,
      sendText: async () => 'x',
      now: () => clockRef.value,
    });
    return executor.runCycle().then(() => {
      assert.strictEqual(harness.sendCalls.length, 0, 'nenhum reenvio automático no boot');
      rmSync(harness.dir, { recursive: true, force: true });
    });
  });
}

function testExecutedNeverReSent() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle()
    .then(() => {
      assert.strictEqual(harness.sendCalls.length, 1);
      clockRef.value += 24 * 3600 * 1000; // ainda mais no futuro
      return harness.executor.runCycle();
    })
    .then(() => {
      assert.strictEqual(harness.sendCalls.length, 1, 'executed nunca é reenviado');
      assert.strictEqual(store.get(record.id).status, 'executed');
      rmSync(harness.dir, { recursive: true, force: true });
    });
}

function testCancelledNeverExecutes() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  store.update(record.id, { status: 'cancelled' });
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 0, 'cancelled não envia');
    assert.strictEqual(store.get(record.id).status, 'cancelled');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testSendTimeoutFails() {
  const harness = makeHarness({ mode: 'hang', sendTimeoutMs: 60 });
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(harness.sendCalls.length, 1, 'tentou enviar e travou');
    const after = store.get(record.id);
    assert.strictEqual(after.status, 'failed', 'timeout vira failed');
    assert.strictEqual(
      after.errorMessage,
      'O envio não retornou confirmação dentro do tempo limite. A mensagem pode ter sido enviada. Verifique o grupo antes de reenviar.'
    );
    assert.strictEqual(after.deliveryUncertain, true, 'timeout: entrega incerta');
    // Reenviar continua sendo MANUAL: novo ciclo NUNCA reenvia automaticamente.
    return harness.executor.runCycle().then(() => {
      assert.strictEqual(harness.sendCalls.length, 1, 'sem retry automático após timeout');
      rmSync(harness.dir, { recursive: true, force: true });
    });
  });
}

function testRetryManualResetsDeliveryUncertain() {
  const harness = makeHarness({ mode: 'hang', sendTimeoutMs: 60 });
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(store.get(record.id).deliveryUncertain, true);
    // "Reenviar" (failed -> scheduled) = ação manual; limpa a dúvida para a
    // próxima tentativa (uma nova execução recomeça do zero).
    const rescheduled = store.update(record.id, { status: 'scheduled' });
    assert.strictEqual(rescheduled.deliveryUncertain, false, 'reagendamento limpa a incerteza');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

function testSentMessageIdPersisted() {
  const harness = makeHarness(); // sender retorna wa_received_<n>
  const { store, clockRef } = harness;
  const record = store.create(makeBaseInput(clockRef.value));
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle()
    .then(() => store.flush())
    .then(() => {
      const onDisk = flushDisk(harness.dir);
      const persisted = onDisk.find((r) => r.id === record.id);
      assert.ok(persisted, 'registro em disco');
      assert.strictEqual(persisted.status, 'executed');
      assert.strictEqual(persisted.sentMessageId, 'wa_received_1', 'id do WPPConnect persistido');
      assert.ok(persisted.executionStartedAt, 'executionStartedAt em disco');
      rmSync(harness.dir, { recursive: true, force: true });
    });
}

function testStoreReloadPreservesExecutedAndFailed() {
  const harness = makeHarness();
  const { store, clockRef } = harness;
  const ok = store.create(makeBaseInput(clockRef.value, { title: 'Vai dar certo' }));
  // bad vence DEPOIS de ok: no 1º ciclo só ok está vencido.
  const bad = store.create(
    makeBaseInput(clockRef.value, { title: 'Vai falhar', scheduledAt: futureIn(clockRef.value, 50 * 3600 * 1000) })
  );
  clockRef.value += 30 * 3600 * 1000;
  return harness.executor.runCycle().then(() => {
    assert.strictEqual(store.get(ok.id).status, 'executed');
    assert.strictEqual(harness.sendCalls.length, 1, 'só o ok foi enviado');
    // bad falha por via manual (running -> failed com erro), como se o envio
    // real tivesse divergido.
    const s2 = store.get(bad.id);
    store.update(s2.id, { status: 'running' });
    store.update(s2.id, { status: 'failed', errorMessage: 'erro de teste' });
    return store.flush();
  }).then(() => {
    const reloaded = createSchedulesStore({
      dataDir: harness.dir,
      now: () => clockRef.value,
      logError: () => {},
    });
    const a = reloaded.get(ok.id);
    const b = reloaded.get(bad.id);
    assert.strictEqual(a.status, 'executed', 'executed preservado após reload');
    assert.ok(a.executedAt, 'executedAt preservado');
    assert.ok(a.sentMessageId, 'sentMessageId preservado');
    assert.strictEqual(b.status, 'failed', 'failed preservado após reload');
    assert.ok(b.errorMessage, 'errorMessage preservado');
    rmSync(harness.dir, { recursive: true, force: true });
  });
}

// ---------------------------------------------------------------- runner ---

async function run() {
  const tests = [
    ['A - agendamento futuro não executa', testFutureNotExecuted],
    ['B - vencido: scheduled -> running -> executed', testDueExecutedFlow],
    ['C - falha no envio: running -> failed + errorMessage', testSendFailureFails],
    ['D1 - conta offline: failed sem chamar send', testSessionOfflineFailsWithoutSend],
    ['D2 - sessão inexistente: failed sem chamar send', testSessionMissingFailsWithoutSend],
    ['E - dois ticks simultâneos: apenas 1 envio', testConcurrentTicksSingleSend],
    ['F - o mesmo agendamento não envia duas vezes', testSameScheduleNotSentTwice],
    ['G - dois agendamentos distintos executam uma única vez', testTwoDueExecutedOnce],
    ['H - running no boot: vira failed e não envia', testOrphanedRunningRecoveredOnBoot],
    ['I - executed nunca é reenviado', testExecutedNeverReSent],
    ['J - cancelled nunca executa', testCancelledNeverExecutes],
    ['K - timeout de send: vira failed', testSendTimeoutFails],
    ['K2 - reenvio manual limpa deliveryUncertain', testRetryManualResetsDeliveryUncertain],
    ['L - sentMessageId persistido quando WPPConnect retorna ID', testSentMessageIdPersisted],
    ['M - reload preserva executed/failed', testStoreReloadPreservesExecutedAndFailed],
  ];

  let failures = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`  ok    ${name}`);
    } catch (err) {
      failures += 1;
      console.error(`  FAIL  ${name}`);
      console.error(`        ${err && err.message ? err.message : String(err)}`);
    }
  }

  if (failures > 0) {
    console.error(`\nschedulingExecutor: ${failures} falha(s)`);
    process.exit(1);
  }
  console.log(`\nschedulingExecutor: ${tests.length} testes ok, 0 falhas`);
}

run().catch((err) => {
  console.error('schedulingExecutor.test.js: FALHOU');
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});