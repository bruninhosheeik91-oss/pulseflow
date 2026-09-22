'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const { mkdirSync, writeFileSync, rmSync } = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const { createInitQueue } = require('./whatsappInitQueue.js');
const SERVER_ENTRY = path.join(__dirname, 'server.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =====================================================================
// Parte 1 — unit: semântica da fila global FIFO
// =====================================================================

function testTwoConnectsOnlyOneCreateAtOnce() {
  const queue = createInitQueue();
  let running = 0;
  let maxRunning = 0;
  const started = () => {
    running += 1;
    maxRunning = Math.max(maxRunning, running);
  };
  const finished = () => {
    running -= 1;
  };
  const tokenA = {};
  const tokenB = {};
  // simula duas sessões pedindo create juntas
  let resolvedA = false;
  let resolvedB = false;
  queue.acquire().then((t) => {
    tokenA.queueToken = t;
    resolvedA = true;
    started(); // A inicia o create() pesado
  });
  queue.acquire().then((t) => {
    tokenB.queueToken = t;
    resolvedB = true;
    started(); // B inicia o create() pesado
  });
  return Promise.resolve()
    .then(() => sleep(0))
    .then(() => {
      assert.strictEqual(resolvedA, true, 'A obtém o slot imediatamente');
      assert.strictEqual(resolvedB, false, 'B NÃO obtém o slot enquanto A detém');
      assert.strictEqual(queue.pending, 1, 'B aguardando na fila');
      assert.strictEqual(queue.active, tokenA.queueToken, 'A é o detentor ativo');
      assert.strictEqual(running, 1, 'apenas A em fase de create');
      assert.strictEqual(maxRunning, 1, 'nunca há 2 create() simultâneos');

      // A termina a fase pesada (QR/ve conectado/erro) e libera a fila.
      finished();
    })
    .then(() => queue.release(tokenA.queueToken))
    .then(() => sleep(0))
    .then(() => {
      assert.strictEqual(resolvedB, true, 'B promovido quando A libera');
      assert.strictEqual(queue.pending, 0);
      assert.strictEqual(queue.active, tokenB.queueToken, 'B agora é o detentor');
      assert.strictEqual(running, 1, 'só B em execução depois da promoção');
      assert.strictEqual(maxRunning, 1, 'máximo de 1 create() simultâneo em todo o fluxo');

      // B termina e libera também.
      finished();
      queue.release(tokenB.queueToken);
    })
    .then(() => sleep(0))
    .then(() => {
      assert.strictEqual(queue.active, null, 'fila vazia após liberar todos');
      assert.strictEqual(running, 0, 'nenhum create em andamento');
    });
}

function testReleasePromotesNextOnQr() {
  return exerciseReleaseReason('QR real gerado');
}

function testReleasePromotesNextOnConnected() {
  return exerciseReleaseReason('conexão estabelecida');
}

function testReleasePromotesNextOnFailure() {
  return exerciseReleaseReason('falha definitiva');
}

function exerciseReleaseReason(reason) {
  const queue = createInitQueue();
  let holderA = null;
  let holderB = null;
  queue.acquire().then((t) => (holderA = t));
  queue.acquire().then((t) => (holderB = t));
  return sleep(0)
    .then(() => {
      assert.ok(holderA, 'A detentor');
      assert.strictEqual(holderB, null, 'B aguardando');
      // Primeira libera ao gerar QR / conectar / falhar -> segunda inicia.
      queue.release(holderA);
    })
    .then(() => sleep(0))
    .then(() => {
      assert.ok(holderB, `segunda inicia após liberação por ${reason}`);
      assert.strictEqual(queue.pending, 0);
      queue.release(holderB);
    });
}

function testReleasesInSequenceDoNotDoublePromote() {
  const queue = createInitQueue();
  let holderA = null;
  let holderB = null;
  queue.acquire().then((t) => (holderA = t));
  queue.acquire().then((t) => (holderB = t));
  return sleep(0)
    .then(() => {
      const promoted = queue.release(holderA);
      assert.strictEqual(promoted, true, 'primeira liberação promove');
      // QR também apareceu depois (ou "conectado" e "fim do ciclo" juntos):
      // liberações adicionais do MESMO token são ignoradas.
      const again = queue.release(holderA);
      assert.strictEqual(again, false, 'segunda liberação do mesmo token não promove');
      const wrongToken = queue.release({});
      assert.strictEqual(wrongToken, false, 'release com token de não-detentor é ignorado');
    })
    .then(() => sleep(0))
    .then(() => {
      assert.ok(holderB, 'B promovido UMA única vez');
      assert.strictEqual(queue.pending, 0);
      queue.release(holderB);
    });
}

function testFifoOrder() {
  const queue = createInitQueue();
  const order = [];
  const acquired = [];
  for (let i = 0; i < 3; i += 1) {
    queue.acquire().then((t) => {
      acquired[i] = t;
      order.push(i);
    });
  }
  return sleep(0)
    .then(() => {
      assert.ok(acquired[0], 'primeiro detém imediato');
      assert.strictEqual(order.length, 1);
      assert.strictEqual(queue.pending, 2);
      queue.release(acquired[0]);
    })
    .then(() => sleep(0))
    .then(() => {
      assert.deepStrictEqual(order, [0, 1], 'FIFO: sessão 1 antes da 2');
      assert.strictEqual(queue.active, acquired[1]);
      queue.release(acquired[1]);
    })
    .then(() => sleep(0))
    .then(() => {
      assert.deepStrictEqual(order, [0, 1, 2], 'FIFO: sessão 2 por último');
      assert.strictEqual(queue.active, acquired[2]);
      queue.release(acquired[2]);
    })
    .then(() => sleep(0))
    .then(() => assert.strictEqual(queue.active, null));
}

function testConnectedSessionsNotInvolvedInQueue() {
  // Sessões APENAS enviam/recebem (cliente vivo) e nunca chamam acquire: a
  // fila NÃO bloqueia tráfego de sessões já conectadas. Único efeito quando
  // alguém realmente adquire é a exclusividade do create pesado.
  const queue = createInitQueue();
  // nenhuma aquisição = nenhuma contenção
  assert.strictEqual(queue.active, null);
  assert.strictEqual(queue.pending, 0);
  // liberar sem titular não faz nada e não quebra
  assert.strictEqual(queue.release({}), false);
  // uma aquisição pontual em fila vazia resolve sem esperar nada
  const holder = { seen: false };
  queue.acquire().then((t) => {
    holder.seen = true;
    holder.token = t;
  });
  return sleep(0).then(() => {
    assert.strictEqual(holder.seen, true, 'detentor único sem contenção');
    queue.release(holder.token);
  });
}

// =====================================================================
// Parte 2 — integração: server real com Chrome falso (create falha rápido)
// =====================================================================

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function spawnServer(port, stateDir) {
  const child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      PULSEFLOW_STATE_DIR: stateDir,
      // Nunca dispara um Chrome real: create() falha rápido e as sessões vão a
      // error — ideal para provar serialização da fila sem memória.
      WPP_CHROME_PATH: path.join('Z:', 'nope', 'chrome-not-found.exe'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => {
    stdout += String(d);
  });
  child.stderr.on('data', (d) => {
    stderr += String(d);
  });
  return { child, getOutput: () => ({ stdout, stderr }) };
}

async function waitForListening(proc, timeoutMs = 15_000) {
  const start = Date.now();
  for (;;) {
    const { stdout } = proc.getOutput();
    if (stdout.includes('API escutando')) return;
    if (proc.child.exitCode !== null) {
      throw new Error(
        `servidor encerrou cedo (code=${proc.child.exitCode})\n${proc.getOutput().stderr}`
      );
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`servidor não iniciou em ${timeoutMs}ms`);
    }
    await sleep(100);
  }
}

function stopServer(proc) {
  return new Promise((resolve) => {
    if (proc.exitCode !== null || proc.killed) {
      resolve();
      return;
    }
    proc.once('exit', resolve);
    proc.kill('SIGTERM');
    setTimeout(() => {
      if (proc.exitCode === null && !proc.killed) proc.kill('SIGKILL');
    }, 3000);
  });
}

async function withServer(fn) {
  // Cada instância do server usa um state dir ISOLADO: o boot-restore de uma
  // instância não interfere na fila da instância seguinte do teste.
  const port = await getFreePort();
  const stateDir = path.join(
    os.tmpdir(),
    `wpp-initq-test-${process.pid}-${port}-${Date.now()}`
  );
  mkdirSync(path.join(stateDir, 'data'), { recursive: true });
  writeFileSync(
    path.join(stateDir, 'data', 'accounts.json'),
    JSON.stringify({ accounts: [] }),
    'utf8'
  );
  const proc = spawnServer(port, stateDir);
  await waitForListening(proc);
  const base = `http://127.0.0.1:${port}`;
  try {
    return await fn(base, () => proc.getOutput().stdout);
  } finally {
    await stopServer(proc.child);
    try {
      rmSync(stateDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch {
      // best-effort
    }
  }
}

async function createAccount(base, name) {
  const res = await fetch(`${base}/api/whatsapp/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.ok, 'criação de conta retorna ok');
  return body.account;
}

async function connectOnce(base, sessionId) {
  const res = await fetch(
    `${base}/api/whatsapp/${encodeURIComponent(sessionId)}/connect`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  );
  assert.strictEqual(res.status, 200);
  return res.json();
}

// Espera a sessão TERMINAR a fase de fila: o log "fila global liberada" é
// impresso quando a sessão detentora gerou QR real, conectou ou falhou de
// definitiva — o desfecho terminal NÃO precisa ser error (WPPConnect pode
// emitir um QR de verdade antes de falhar, gerando awaiting_qr). O sinal de
// serialização é a liberação em si, não o estado final.
async function waitForQueueReleaseLog(getLogs, sessionId, timeoutMs = 20_000) {
  const marker = `[${sessionId}] fila global liberada (`;
  const start = Date.now();
  for (;;) {
    const logs = getLogs();
    if (logs.includes(marker)) {
      return logs.indexOf(marker);
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `[${sessionId}] não liberou a fila global em ${timeoutMs}ms (sem marker ${marker})`
      );
    }
    await sleep(100);
  }
}

function countSubstring(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function indexOfSubstring(haystack, needle) {
  return haystack.indexOf(needle);
}

// 1) Duas sessões pedem connect juntas -> apenas UM create() simultâneo.
// 2) Primeira libera a fila (QR/ve conectado/erro) -> segunda inicia (log ordering).
// 3) O campo queued existe e é booleano (estado honesto).
async function testIntegrationTwoSessionsSerialized() {
  await withServer(async (base, getLogs) => {
    const a = await createAccount(base, 'Sessao A');
    const b = await createAccount(base, 'Sessao B');

    // Aguarda AMBAS terem passado pela fila (independe de chegar a error:
    // QR real também libera a fila).
    const releasedA = await waitForQueueReleaseLog(getLogs, a.sessionId);
    const releasedB = await waitForQueueReleaseLog(getLogs, b.sessionId);

    const logs = getLogs();
    const startedA = indexOfSubstring(logs, `[${a.sessionId}] fila liberada - iniciando criação WPPConnect`);
    const startedB = indexOfSubstring(logs, `[${b.sessionId}] fila liberada - iniciando criação WPPConnect`);
    assert.ok(startedA >= 0, 'A logou o início de criação');
    assert.ok(startedB >= 0, 'B logou o início de criação');
    assert.ok(
      startedA < releasedA,
      'A iniciou antes de liberar a fila'
    );
    assert.ok(
      startedB > releasedA,
      'B só iniciou DEPOIS que A liberou a fila (1 create por vez)'
    );
    assert.ok(
      startedB < releasedB,
      'B liberou a fila depois de iniciar'
    );
    assert.strictEqual(
      countSubstring(logs, `[${a.sessionId}] fila liberada - iniciando criação WPPConnect`),
      1,
      'A cria apenas 1 vez (sem retry pela fila)'
    );
    assert.strictEqual(
      countSubstring(logs, `[${b.sessionId}] fila liberada - iniciando criação WPPConnect`),
      1,
      'B cria apenas 1 vez'
    );

    // Estado honesto: queued presente e booleano na listagem de contas.
    const accRes = await fetch(`${base}/api/whatsapp/accounts`);
    const accBody = await accRes.json();
    assert.ok(Array.isArray(accBody.accounts), 'accounts é array');
    for (const acc of accBody.accounts) {
      assert.strictEqual(typeof acc.queued, 'boolean', `queued booleano em ${acc.sessionId}`);
    }
  });
}

// connect repetido da mesma sessão NÃO duplica a entrada na fila.
async function testIntegrationRepeatedConnectNoDuplicateQueueEntry() {
  await withServer(async (base, getLogs) => {
    const a = await createAccount(base, 'Sessao Repetida');
    // Repete connect rapidamente enquanto o primeiro init ainda está pendente.
    await connectOnce(base, a.sessionId);
    await connectOnce(base, a.sessionId);
    await waitForQueueReleaseLog(getLogs, a.sessionId);
    const logs = getLogs();
    assert.strictEqual(
      countSubstring(logs, `[${a.sessionId}] fila liberada - iniciando criação WPPConnect`),
      1,
      'connect repetido não duplica create() na fila'
    );
  });
}

async function run() {
  const unit = [
    ['duas sessões pedem connect juntas -> apenas 1 create simultâneo', testTwoConnectsOnlyOneCreateAtOnce],
    ['primeira gera QR real -> segunda inicia', testReleasePromotesNextOnQr],
    ['primeira conecta -> segunda inicia', testReleasePromotesNextOnConnected],
    ['primeira falha -> segunda inicia', testReleasePromotesNextOnFailure],
    ['releases em sequência (QR+conectado+erro) não promovem duas vezes', testReleasesInSequenceDoNotDoublePromote],
    ['FIFO: terceira sessão espera a segunda', testFifoOrder],
    ['sessões conectadas fora da fila / fila não bloqueia envio', testConnectedSessionsNotInvolvedInQueue],
  ];
  for (const [name, fn] of unit) {
    await fn();
    console.log(`  ok    unit - ${name}`);
  }

  await testIntegrationTwoSessionsSerialized();
  console.log('  ok    integração - duas sessões: 1 create por vez + fila liberada antes da 2ª iniciar');
  await testIntegrationRepeatedConnectNoDuplicateQueueEntry();
  console.log('  ok    integração - connect repetido da mesma sessão não duplica a fila');

  console.log('whatsappInitQueue.test.js: TODOS OS TESTES PASSARAM');
}

run().catch((err) => {
  console.error('\nwhatsappInitQueue.test.js: FALHOU');
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});