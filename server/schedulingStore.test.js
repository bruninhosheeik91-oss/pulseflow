'use strict';

const assert = require('assert');
const { mkdtempSync, existsSync, readFileSync, rmSync } = require('fs');
const os = require('os');
const path = require('path');
const {
  createSchedulesStore,
  ScheduleStoreError,
  ALLOWED_TRANSITIONS,
  DELETABLE_STATUSES,
} = require('./schedulingStore.js');

// ---------------------------------------------------------------- helpers ---

const now = () => Date.now();
const futureIn = (ms) => new Date(now() + ms).toISOString();
const pastIn = (ms) => new Date(now() - ms).toISOString();

function tempDir() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'schedules-'));
  return dir;
}

function baseInput(overrides) {
  return Object.assign(
    {
      title: 'Divulgação ofertas do dia',
      sessionId: 'wa_abc123',
      accountName: 'WhatsApp 1',
      destinationId: '1203630294182910@g.us',
      destinationName: 'Ofertas VIP',
      scheduledAt: futureIn(24 * 3600 * 1000),
      message: 'Confira as ofertas de hoje!',
    },
    overrides || {}
  );
}

function makeStore(dir, overrides) {
  return createSchedulesStore(
    Object.assign({ dataDir: dir, logError: () => {} }, overrides || {})
  );
}

async function flushAndRead(dir) {
  const filePath = path.join(dir, 'schedules.json');
  assert.ok(existsSync(filePath), 'arquivo schedules.json criado em disco');
  return JSON.parse(readFileSync(filePath, 'utf8')).schedules || [];
}

// ---------------------------------------------------------------- testes ---

function testCreateValid() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  assert.ok(record.id, 'id gerado no backend');
  assert.strictEqual(record.status, 'scheduled');
  assert.ok(record.createdAt, 'createdAt gerado no backend');
  assert.ok(record.updatedAt, 'updatedAt gerado no backend');
  assert.strictEqual(record.executedAt, null);
  assert.strictEqual(record.cancelledAt, null);
  assert.strictEqual(record.errorMessage, null);
  assert.strictEqual(record.deliveryUncertain, false, 'criação: entrega não é incerta');
  assert.strictEqual(typeof store.get(record.id).id, 'string');
  assert.strictEqual(store.list().length, 1, 'list tem 1 registro');
  rmSync(dir, { recursive: true, force: true });
}

function testRejectPastDate() {
  const dir = tempDir();
  const store = makeStore(dir);
  assert.throws(
    () => store.create(baseInput({ scheduledAt: pastIn(3600 * 1000) })),
    (err) =>
      err instanceof ScheduleStoreError &&
      err.statusCode === 400 &&
      /futuro/i.test(err.message),
    'data passada rejeitada com 400'
  );
  assert.strictEqual(store.list().length, 0, 'nada foi persistido');
  rmSync(dir, { recursive: true, force: true });
}

function testRejectInvalidPayloads() {
  const dir = tempDir();
  const store = makeStore(dir);
  assert.throws(
    () => store.create(baseInput({ title: '   ' })),
    (err) => err.statusCode === 400 && /Título/i.test(err.message)
  );
  assert.throws(
    () => store.create(baseInput({ sessionId: '' })),
    (err) => err.statusCode === 400 && /sessionId/i.test(err.message)
  );
  assert.throws(
    () => store.create(baseInput({ destinationId: '' })),
    (err) => err.statusCode === 400 && /destinationId/i.test(err.message)
  );
  assert.throws(
    () => store.create(baseInput({ message: '  ' })),
    (err) => err.statusCode === 400 && /Mensagem/i.test(err.message)
  );
  assert.throws(
    () => store.create(baseInput({ scheduledAt: 'não-é-data' })),
    (err) => err.statusCode === 400 && /scheduledAt/i.test(err.message)
  );
  assert.strictEqual(store.list().length, 0);
  rmSync(dir, { recursive: true, force: true });
}

function testListSorted() {
  const dir = tempDir();
  const store = makeStore(dir);
  store.create(baseInput({ title: 'Tarde', scheduledAt: futureIn(6 * 3600 * 1000) }));
  store.create(baseInput({ title: 'Cedo', scheduledAt: futureIn(3600 * 1000) }));
  const list = store.list();
  assert.strictEqual(list.length, 2);
  assert.strictEqual(list[0].title, 'Cedo', 'ordena por scheduledAt crescente');
  rmSync(dir, { recursive: true, force: true });
}

function testEditScheduled() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  const updated = store.update(record.id, {
    title: 'Novo título',
    message: 'Nova mensagem',
    scheduledAt: futureIn(48 * 3600 * 1000),
  });
  assert.strictEqual(updated.title, 'Novo título');
  assert.strictEqual(updated.message, 'Nova mensagem');
  assert.strictEqual(updated.status, 'scheduled');
  assert.ok(
    Date.parse(updated.updatedAt) >= Date.parse(record.updatedAt),
    'updatedAt atualizado'
  );
  assert.strictEqual(store.get(record.id).accountName, record.accountName, 'campos não enviados preservados');
  rmSync(dir, { recursive: true, force: true });
}

function testCancelScheduled() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  const cancelled = store.update(record.id, { status: 'cancelled' });
  assert.strictEqual(cancelled.status, 'cancelled');
  assert.ok(cancelled.cancelledAt, 'cancelledAt preenchido');
  rmSync(dir, { recursive: true, force: true });
}

function testCannotEditExecuted() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  store.update(record.id, { status: 'running' });
  store.update(record.id, { status: 'executed' });
  assert.throws(
    () => store.update(record.id, { title: 'tentar mudar' }),
    (err) => err.statusCode === 409,
    'executed não pode ser editado'
  );
  assert.throws(
    () => store.update(record.id, { status: 'cancelled' }),
    (err) => err.statusCode === 409,
    'executed -> cancelled é transição inválida'
  );
  rmSync(dir, { recursive: true, force: true });
}

function testValidTransitions() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  const transitions = [
    ['scheduled', 'running'],
    ['running', 'executed'],
  ];
  let current = record;
  for (const [from, to] of transitions) {
    assert.strictEqual(current.status, from);
    current = store.update(current.id, { status: to });
    assert.strictEqual(current.status, to);
  }
  assert.ok(current.executedAt, 'executedAt preenchido na transição p/ executed');
  assert.strictEqual(current.cancelledAt, null);
  rmSync(dir, { recursive: true, force: true });
}

function testFailedToScheduledRetry() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  store.update(record.id, { status: 'running' });
  store.update(record.id, { status: 'failed', errorMessage: 'rate limit' });
  const retried = store.update(record.id, { status: 'scheduled' });
  assert.strictEqual(retried.status, 'scheduled');
  assert.strictEqual(retried.errorMessage, null, 'erro limpo no reagendamento');
  assert.strictEqual(retried.executedAt, null);
  rmSync(dir, { recursive: true, force: true });
}

function testInvalidTransitions() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  const recordId = record.id;
  const invalidCases = [
    { current: 'scheduled', to: 'executed', label: 'scheduled -> executed' },
    { current: 'scheduled', to: 'failed', label: 'scheduled -> failed' },
    { current: 'cancelled', to: 'running', label: 'cancelled -> running' },
    { current: 'executed', to: 'scheduled', label: 'executed -> scheduled' },
    { current: 'failed', to: 'executed', label: 'failed -> executed' },
  ];
  for (const { current, to, label } of invalidCases) {
    const item = store.create(baseInput({ title: label }));
    if (current === 'cancelled') store.update(item.id, { status: 'cancelled' });
    assert.throws(
      () => store.update(item.id, { status: to }),
      (err) => err.statusCode === 409,
      `${label} deve ser rejeitada`
    );
  }
  // transição para o MESMO status também é inválida
  assert.throws(
    () => store.update(recordId, { status: 'scheduled' }),
    (err) => err.statusCode === 409,
    'scheduled -> scheduled rejeitado'
  );
  // status desconhecido
  assert.throws(
    () => store.update(recordId, { status: 'qualquer-coisa' }),
    (err) => err.statusCode === 400,
    'status inválido rejeitado'
  );
  rmSync(dir, { recursive: true, force: true });
}

function testDeleteRules() {
  const dir = tempDir();
  const store = makeStore(dir);

  const scheduled = store.create(baseInput({ title: 'scheduled' }));
  assert.throws(
    () => store.remove(scheduled.id),
    (err) => err.statusCode === 409,
    'delete de scheduled bloqueado'
  );

  const running = store.create(baseInput({ title: 'running' }));
  store.update(running.id, { status: 'running' });
  assert.throws(
    () => store.remove(running.id),
    (err) => err.statusCode === 409,
    'delete de running bloqueado'
  );

  const executed = store.create(baseInput({ title: 'executed' }));
  store.update(executed.id, { status: 'running' });
  store.update(executed.id, { status: 'executed' });
  assert.strictEqual(store.remove(executed.id), true, 'executed removível');

  const failed = store.create(baseInput({ title: 'failed' }));
  store.update(failed.id, { status: 'running' });
  store.update(failed.id, { status: 'failed' });
  assert.strictEqual(store.remove(failed.id), true, 'failed removível');

  const cancelled = store.create(baseInput({ title: 'cancelled' }));
  store.update(cancelled.id, { status: 'cancelled' });
  assert.strictEqual(store.remove(cancelled.id), true, 'cancelled removível');

  // remove inexistente -> 404
  assert.throws(
    () => store.remove('nao-existe'),
    (err) => err.statusCode === 404
  );
  rmSync(dir, { recursive: true, force: true });
}

function testPersistenceAcrossReload() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  return store.flush().then(async () => {
    const reloaded = makeStore(dir);
    const list = reloaded.list();
    assert.strictEqual(list.length, 1, 'após reload, registro persiste');
    assert.strictEqual(list[0].id, record.id);
    assert.strictEqual(list[0].status, 'scheduled');
    assert.strictEqual(list[0].title, record.title);
    rmSync(dir, { recursive: true, force: true });
  });
}

function testConcurrentWritesNoLostRecords() {
  const dir = tempDir();
  const store = makeStore(dir);
  const first = store.create(baseInput({ title: 'Primeiro' }));
  const second = store.create(baseInput({ title: 'Segundo' }));
  // Sem await entre as duas criações: simula chamadas simultâneas. A fila de
  // escrita serializada grava o estado completo e nenhum registro se perde.
  return Promise.all([store.flush(), store.flush()]).then(async () => {
    const onDisk = await flushAndRead(dir);
    assert.strictEqual(onDisk.length, 2, 'duas escritas concorrentes preservam ambos');
    const titles = onDisk.map((r) => r.title).sort();
    assert.deepStrictEqual(titles, ['Primeiro', 'Segundo']);

    const reloaded = makeStore(dir);
    assert.strictEqual(reloaded.list().length, 2, 'reload mantém os 2');
    assert.ok(reloaded.get(first.id), 'primeiro registro presente');
    assert.ok(reloaded.get(second.id), 'segundo registro presente');
    rmSync(dir, { recursive: true, force: true });
  });
}

function testTransitionMapIntegrity() {
  assert.ok(ALLOWED_TRANSITIONS.scheduled.includes('running'));
  assert.ok(ALLOWED_TRANSITIONS.scheduled.includes('cancelled'));
  assert.ok(ALLOWED_TRANSITIONS.running.includes('executed'));
  assert.ok(ALLOWED_TRANSITIONS.running.includes('failed'));
  assert.ok(ALLOWED_TRANSITIONS.failed.includes('scheduled'));
  assert.deepStrictEqual(ALLOWED_TRANSITIONS.executed, []);
  assert.deepStrictEqual(ALLOWED_TRANSITIONS.cancelled, []);
  assert.deepStrictEqual(
    DELETABLE_STATUSES,
    ['executed', 'failed', 'cancelled'],
    'delete apenas para status fechados'
  );
}

function testDeliveryUncertain() {
  const dir = tempDir();
  const store = makeStore(dir);
  const record = store.create(baseInput());
  // Falha com entrega incerta (timeout): markFailed(true).
  store.update(record.id, { status: 'running' });
  const uncertain = store.markFailed(
    record.id,
    'O envio não retornou confirmação dentro do tempo limite.',
    Date.now(),
    true
  );
  assert.strictEqual(uncertain.status, 'failed');
  assert.strictEqual(uncertain.deliveryUncertain, true, 'timeout marca entrega incerta');
  // Falha normal: markFailed(false) / sem flag -> não incerta.
  store.update(record.id, { status: 'scheduled' });
  store.update(record.id, { status: 'running' });
  const normal = store.markFailed(record.id, 'rate limit', Date.now(), false);
  assert.strictEqual(normal.deliveryUncertain, false, 'falha normal não é incerta');
  // Reenviar (failed -> scheduled) limpa a incerteza e o erro.
  const rescheduled = store.update(record.id, { status: 'scheduled' });
  assert.strictEqual(rescheduled.deliveryUncertain, false, 'reagendamento limpa incerteza');
  assert.strictEqual(rescheduled.errorMessage, null, 'reagendamento limpa erro');
  // Boot: running órfão vira failed COM incerteza (mensagem pode ter sido enviada).
  store.update(record.id, { status: 'running' });
  const recovered = store.recoverOrphanedRunning();
  assert.deepStrictEqual(recovered, [record.id]);
  const orphan = store.get(record.id);
  assert.strictEqual(orphan.status, 'failed');
  assert.strictEqual(orphan.deliveryUncertain, true, 'running órfão: entrega incerta');
  assert.strictEqual(
    orphan.errorMessage,
    'Execução interrompida antes da confirmação. Reenvio manual necessário.'
  );
  rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------- runner ---

async function run() {
  const tests = [
    ['criar agendamento válido', testCreateValid],
    ['rejeitar data passada', testRejectPastDate],
    ['rejeitar payloads inválidos (validações)', testRejectInvalidPayloads],
    ['listar ordenado por scheduledAt', testListSorted],
    ['editar agendamento scheduled', testEditScheduled],
    ['cancelar agendamento', testCancelScheduled],
    ['impedir edição de executed', testCannotEditExecuted],
    ['transições válidas', testValidTransitions],
    ['failed -> scheduled (reagendar)', testFailedToScheduledRetry],
    ['transições inválidas', testInvalidTransitions],
    ['regras de delete (executed/failed/cancelled)', testDeleteRules],
    ['persistência após reload do store', testPersistenceAcrossReload],
    ['duas escritas concorrentes sem perder registros', testConcurrentWritesNoLostRecords],
    ['integridade da máquina de estados', testTransitionMapIntegrity],
    ['deliveryUncertain: timeout/orfao/vazio + reset no reagendamento', testDeliveryUncertain],
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
    console.error(`\nschedulingStore: ${failures} falha(s)`);
    process.exit(1);
  }
  console.log(`\nschedulingStore: ${tests.length} testes ok, 0 falhas`);
}

run().catch((err) => {
  console.error('schedulingStore.test.js: FALHOU');
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});