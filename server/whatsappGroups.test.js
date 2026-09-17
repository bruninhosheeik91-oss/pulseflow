'use strict';

const assert = require('assert');
const {
  createGroupsSyncEngine,
  WppCallTimeoutError,
} = require('./whatsappGroups.js');
const { normalizeGroupSource } = require('./whatsappGroupMembers.js');

// ---------------------------------------------------------------- helpers ---

function makeClock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms) => {
      t += ms;
    },
  };
}

function baseOptions(clock, overrides) {
  return Object.assign(
    {
      now: clock.now,
      normalizeGroupSource,
      warmupMs: 15_000,
      listChatsTimeoutMs: 60,
      fallbackTimeoutMs: 30,
      timeoutRetryMs: 12_000,
      orphanMs: 60_000,
      cacheTtlMs: 5_000,
      log: () => {},
      logError: () => {},
    },
    overrides || {}
  );
}

const group = (id, name) => ({ id, name, isGroup: true });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// ------------------------------------------------------------------- tests ---

async function testWarmupBlocksWpp() {
  const clock = makeClock();
  let listChatsCalls = 0;
  const client = {
    listChats: () => {
      listChatsCalls += 1;
      return Promise.resolve([group('1@g.us', 'Um')]);
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  engine.noteConnected('wa_x');

  const r = await engine.listGroups('wa_x', client);
  assert.strictEqual(r.status, 'warming', 'warm-up: status warming');
  assert.strictEqual(r.warmingUp, true);
  assert.ok(r.retryAfterMs > 0, 'warm-up: retryAfterMs > 0');
  assert.strictEqual(
    listChatsCalls,
    0,
    'MAIN há menos de 15s: NENHUMA chamada WPP de grupos'
  );

  clock.advance(15_000 + 1);
  const r2 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r2.status, 'ok', 'após warm-up sincroniza');
  assert.strictEqual(listChatsCalls, 1);
  assert.strictEqual(r2.groups.length, 1);
}

async function testTimeoutDoesNotStackFallbacks() {
  const clock = makeClock();
  let listChatsCalls = 0;
  let getAllGroupsCalls = 0;
  let getAllChatsCalls = 0;
  let releaseListChats;
  const pending = new Promise((resolve) => {
    releaseListChats = resolve;
  });

  const client = {
    listChats: () => {
      listChatsCalls += 1;
      return pending;
    },
    getAllGroups: () => {
      getAllGroupsCalls += 1;
      return Promise.resolve([group('g@g.us', 'G')]);
    },
    getAllChats: () => {
      getAllChatsCalls += 1;
      return Promise.resolve([group('h@g.us', 'H')]);
    },
  };

  const engine = createGroupsSyncEngine(baseOptions(clock));

  // A) listChats pendente + B) timeout ocorre
  const r1 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r1.status, 'timeout', 'B: timeout detectado');
  assert.strictEqual(r1.runtimeTimeout, true);
  assert.strictEqual(listChatsCalls, 1, 'A: listChats foi iniciado uma vez');

  // C) getAllGroups NÃO chamado; D) getAllChats NÃO chamado
  assert.strictEqual(
    getAllGroupsCalls,
    0,
    'C: getAllGroups NÃO pode rodar após timeout de listChats'
  );
  assert.strictEqual(
    getAllChatsCalls,
    0,
    'D: getAllChats NÃO pode rodar após timeout de listChats'
  );

  // E) segunda chamada enquanto a Promise WPP original está viva
  const r2 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r2.status, 'syncing', 'E: syncInProgress enquanto op viva');
  assert.strictEqual(r2.syncInProgress, true);
  assert.strictEqual(listChatsCalls, 1, 'E: JAMAIS segunda listChats concorrente');
  assert.strictEqual(getAllGroupsCalls, 0);
  assert.strictEqual(getAllChatsCalls, 0);

  // F) após a Promise original resolver, nova tentativa pode começar
  releaseListChats([group('real@g.us', 'Real')]);
  await flush();
  clock.advance(12_001); // vence o backoff de timeout
  const r3 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r3.status, 'ok', 'F: nova tentativa após resolver');
  assert.strictEqual(listChatsCalls, 2, 'F: nova listChats permitida');
  assert.strictEqual(r3.groups.length, 1);

  // G) sucesso salva cache -> próxima chamada NÃO toca no WPP
  assert.strictEqual(
    engine._getInternalState('wa_x').cacheGroups.length,
    1,
    'G: cache salvo'
  );
  const r4 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r4.cached, true, 'G: servido do cache');
  assert.strictEqual(listChatsCalls, 2, 'G: cache evita nova chamada WPP');
}

async function testFallbackWhenListChatsMissing() {
  const clock = makeClock();
  let getAllGroupsCalls = 0;
  const client = {
    getAllGroups: () => {
      getAllGroupsCalls += 1;
      return Promise.resolve([group('g@g.us', 'G')]);
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_x', client);
  assert.strictEqual(r.status, 'ok');
  assert.strictEqual(r.groups.length, 1);
  assert.strictEqual(getAllGroupsCalls, 1, 'listChats ausente: fallback permitido');
}

async function testFallbackOnFastError() {
  const clock = makeClock();
  let getAllGroupsCalls = 0;
  const client = {
    listChats: () => {
      throw new Error('listChats not supported');
    },
    getAllGroups: () => {
      getAllGroupsCalls += 1;
      return Promise.resolve([group('g@g.us', 'G')]);
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_x', client);
  assert.strictEqual(r.status, 'ok');
  assert.strictEqual(r.groups.length, 1);
  assert.strictEqual(getAllGroupsCalls, 1, 'erro rápido: fallback permitido');
}

async function testFallbackOnValidEmpty() {
  const clock = makeClock();
  let getAllGroupsCalls = 0;
  const client = {
    listChats: () => Promise.resolve([]),
    getAllGroups: () => {
      getAllGroupsCalls += 1;
      return Promise.resolve([group('g@g.us', 'G')]);
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_x', client);
  assert.strictEqual(r.status, 'ok');
  assert.strictEqual(r.groups.length, 1);
  assert.strictEqual(
    getAllGroupsCalls,
    1,
    'vazio válido (runtime estável): fallback permitido'
  );
}

async function testFallbackTimeoutStopsChain() {
  const clock = makeClock();
  let getAllChatsCalls = 0;
  const never = new Promise(() => {});
  const client = {
    listChats: () => Promise.resolve([]),
    getAllGroups: () => never,
    getAllChats: () => {
      getAllChatsCalls += 1;
      return Promise.resolve([group('h@g.us', 'H')]);
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_x', client);
  assert.strictEqual(r.status, 'timeout');
  assert.strictEqual(
    getAllChatsCalls,
    0,
    'timeout no fallback encerra a cadeia (não empilha getAllChats)'
  );
}

async function testValidEmptyIsNotTimeout() {
  const clock = makeClock();
  const client = { listChats: () => Promise.resolve([]) };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_x', client);
  assert.strictEqual(r.status, 'ok', 'vazio válido não é timeout');
  assert.strictEqual(r.runtimeTimeout, false);
  assert.strictEqual(r.groups.length, 0);
}

async function testOrphanOperationIsReleased() {
  const clock = makeClock();
  let listChatsCalls = 0;
  const never = new Promise(() => {});
  const client = {
    listChats: () => {
      listChatsCalls += 1;
      return listChatsCalls === 1 ? never : Promise.resolve([group('x@g.us', 'X')]);
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r1 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r1.status, 'timeout');

  // Antes de 60s: ainda travado (single-flight real).
  clock.advance(59_000);
  const r2 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r2.status, 'syncing');
  assert.strictEqual(listChatsCalls, 1);

  // Após 60s a operação é considerada órfã e libera nova tentativa.
  clock.advance(2_000);
  const r3 = await engine.listGroups('wa_x', client);
  assert.strictEqual(r3.status, 'ok');
  assert.strictEqual(listChatsCalls, 2);
}

function testTimeoutErrorType() {
  const err = new WppCallTimeoutError('listChats', 15_000);
  assert.ok(err instanceof Error, 'WppCallTimeoutError é Error');
  assert.strictEqual(err.name, 'WppCallTimeoutError');
  assert.strictEqual(err.kind, 'timeout');
}

// H) Sincronização real informa syncedAt; leitura de cache NÃO o atualiza.
async function testSyncedAtFromRealSnapshot() {
  const clock = makeClock();
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const client = { listChats: () => Promise.resolve([group('1@g.us', 'Um')]) };

  const r = await engine.listGroups('wa_x', client);
  assert.strictEqual(r.status, 'ok');
  assert.ok(
    typeof r.syncedAt === 'string' && !Number.isNaN(Date.parse(r.syncedAt)),
    'H: sincronização real informa syncedAt ISO'
  );
  const first = r.syncedAt;

  clock.advance(1_000);
  const cached = await engine.listGroups('wa_x', client);
  assert.strictEqual(cached.cached, true, 'H: segunda leitura vem do cache');
  assert.strictEqual(
    cached.syncedAt,
    first,
    'H: cache preserva o horário REAL (não muda só por ler)'
  );
}

// I) Snapshot persistido é lido SEM tocar no WPP e mantém o `at` original.
function testGetCachedGroupsReadsPersistedSnapshot() {
  const clock = makeClock();
  const persistedAt = clock.now() - 120_000;
  const engine = createGroupsSyncEngine(
    baseOptions(clock, {
      loadPersistedSnapshot: () => ({
        groups: [group('9@g.us', 'Nove')],
        syncedAt: persistedAt,
      }),
    })
  );

  const snap = engine.getCachedGroups('wa_x');
  assert.strictEqual(snap.groups.length, 1, 'I: grupos do snapshot retornados');
  assert.strictEqual(
    snap.syncedAt,
    new Date(persistedAt).toISOString(),
    'I: syncedAt é o instante REAL do arquivo'
  );

  const again = engine.getCachedGroups('wa_x');
  assert.strictEqual(again.groups.length, 1);
  assert.strictEqual(again.syncedAt, snap.syncedAt, 'I: leitura é estável');
}

// J) seedCache propaga o timestamp real vindo do disco.
function testSeedCacheKeepsRealTimestamp() {
  const clock = makeClock();
  const seededAt = clock.now() - 60_000;
  const engine = createGroupsSyncEngine(baseOptions(clock));
  engine.seedCache('wa_x', [group('7@g.us', 'Sete')], seededAt);

  const snap = engine.getCachedGroups('wa_x');
  assert.strictEqual(snap.groups.length, 1);
  assert.strictEqual(snap.syncedAt, new Date(seededAt).toISOString());
}

// K) Snapshot legado sem `at` -> syncedAt null (nunca inventa "agora").
function testLegacySnapshotWithoutTimestamp() {
  const clock = makeClock();
  const engine = createGroupsSyncEngine(
    baseOptions(clock, {
      loadPersistedSnapshot: () => [group('5@g.us', 'Cinco')],
    })
  );

  const snap = engine.getCachedGroups('wa_x');
  assert.strictEqual(snap.groups.length, 1);
  assert.strictEqual(
    snap.syncedAt,
    null,
    'K: sem timestamp real não inventa horário'
  );
}

async function run() {
  const tests = [
    ['warm-up após MAIN bloqueia WPP', testWarmupBlocksWpp],
    ['timeout não empilha fallbacks + single-flight real (A-G)', testTimeoutDoesNotStackFallbacks],
    ['fallback quando listChats ausente', testFallbackWhenListChatsMissing],
    ['fallback em erro rápido de listChats', testFallbackOnFastError],
    ['fallback em vazio válido de listChats', testFallbackOnValidEmpty],
    ['timeout no fallback encerra a cadeia', testFallbackTimeoutStopsChain],
    ['vazio válido não é timeout', testValidEmptyIsNotTimeout],
    ['operação órfã (>60s) é liberada', testOrphanOperationIsReleased],
    ['WppCallTimeoutError é tipado', testTimeoutErrorType],
    ['syncedAt real + cache não atualiza horário (H)', testSyncedAtFromRealSnapshot],
    ['getCachedGroups lê snapshot sem WPP (I)', testGetCachedGroupsReadsPersistedSnapshot],
    ['seedCache preserva timestamp real (J)', testSeedCacheKeepsRealTimestamp],
    ['snapshot legado sem at -> syncedAt null (K)', testLegacySnapshotWithoutTimestamp],
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
    console.error(`\nwhatsappGroups: ${failures} falha(s)`);
    process.exit(1);
  }
  console.log(`\nwhatsappGroups: ${tests.length} testes ok, 0 falhas`);
}

run().catch((err) => {
  console.error('whatsappGroups.test.js: FALHOU');
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
