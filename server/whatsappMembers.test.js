'use strict';

const assert = require('assert');
const { createGroupsSyncEngine } = require('./whatsappGroups.js');
const {
  extractMemberCount,
  normalizeGroupSource,
} = require('./whatsappGroupMembers.js');

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
      listChatsTimeoutMs: 200,
      fallbackTimeoutMs: 50,
      timeoutRetryMs: 12_000,
      orphanMs: 60_000,
      cacheTtlMs: 5_000,
      memberCountTimeoutMs: 40,
      memberCountConcurrency: 2,
      log: () => {},
      logError: () => {},
    },
    overrides || {}
  );
}

const never = () => new Promise(() => {});
const groupWithParticipants = (id, name, size) => ({
  id,
  name,
  participants: new Array(size).fill({}),
});

// ------------------------------------------------------------------- tests ---

// A) payload de listChats já traz participants -> usa direto, sem chamar WPP.
async function testPayloadParticipantsPreferred() {
  const clock = makeClock();
  let memberCalls = 0;
  const client = {
    listChats: () =>
      Promise.resolve([groupWithParticipants('a@g.us', 'A', 35)]),
    getGroupMembersIds: () => {
      memberCalls += 1;
      return Promise.resolve([]);
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_a', client);

  assert.strictEqual(r.status, 'ok');
  assert.strictEqual(r.groups[0].memberCount, 35, 'A: memberCount = 35');
  assert.strictEqual(
    memberCalls,
    0,
    'A: getGroupMembersIds NÃO pode ser chamado quando já há participants'
  );
}

// B) sem participants -> fallback getGroupMembersIds (120 ids).
async function testFallbackGroupMembersIds() {
  const clock = makeClock();
  let memberCalls = 0;
  const client = {
    listChats: () => Promise.resolve([{ id: 'b@g.us', name: 'B' }]),
    getGroupMembersIds: (groupId) => {
      memberCalls += 1;
      assert.strictEqual(groupId, 'b@g.us');
      return Promise.resolve(new Array(120).fill({ user: 'x' }));
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_b', client);

  assert.strictEqual(r.status, 'ok');
  assert.strictEqual(r.groups[0].memberCount, 120, 'B: memberCount = 120');
  assert.strictEqual(memberCalls, 1);
}

// C) getGroupMembersIds timeout com cache anterior = 95 -> continua 95.
async function testTimeoutPreservesPreviousCount() {
  const clock = makeClock();
  const client = {
    listChats: () =>
      Promise.resolve([groupWithParticipants('c@g.us', 'C', 95)]),
    getGroupMembersIds: never,
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));

  const r1 = await engine.listGroups('wa_c', client);
  assert.strictEqual(r1.groups[0].memberCount, 95, 'C: cache inicial 95');

  // Expira o TTL do cache e o payload passa a não trazer participants.
  clock.advance(5_001);
  client.listChats = () => Promise.resolve([{ id: 'c@g.us', name: 'C' }]);

  const r2 = await engine.listGroups('wa_c', client);
  assert.strictEqual(
    r2.groups[0].memberCount,
    95,
    'C: timeout do fallback preserva a última contagem válida (95)'
  );
}

// D) getGroupMembersIds timeout sem cache -> null (NUNCA 0).
async function testTimeoutWithoutCacheIsNull() {
  const clock = makeClock();
  const client = {
    listChats: () => Promise.resolve([{ id: 'd@g.us', name: 'D' }]),
    getGroupMembersIds: never,
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_d', client);

  assert.strictEqual(r.groups[0].memberCount, null, 'D: sem cache = null');
  assert.notStrictEqual(r.groups[0].memberCount, 0, 'D: falha NUNCA vira 0');
}

// E) 10 grupos -> no máximo 2 getGroupMembersIds simultâneos.
async function testConcurrencyLimit() {
  const clock = makeClock();
  let active = 0;
  let maxActive = 0;
  let calls = 0;
  const client = {
    listChats: () =>
      Promise.resolve(
        Array.from({ length: 10 }, (_, i) => ({
          id: `e${i}@g.us`,
          name: `E${i}`,
        }))
      ),
    getGroupMembersIds: async () => {
      calls += 1;
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 15));
      active -= 1;
      return new Array(5).fill({});
    },
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));
  const r = await engine.listGroups('wa_e', client);

  assert.strictEqual(r.groups.length, 10);
  assert.strictEqual(calls, 10);
  assert.ok(maxActive <= 2, `E: concorrência ${maxActive} excedeu o limite de 2`);
  assert.ok(
    r.groups.every((g) => g.memberCount === 5),
    'E: todos receberam a contagem do fallback'
  );
}

// F) duas sessões com o MESMO groupId -> caches independentes.
async function testIndependentSessionsCache() {
  const clock = makeClock();
  const clientA = {
    listChats: () => Promise.resolve([{ id: 'shared@g.us', name: 'S' }]),
    getGroupMembersIds: () => Promise.resolve(new Array(100).fill({})),
  };
  const clientB = {
    listChats: () => Promise.resolve([{ id: 'shared@g.us', name: 'S' }]),
    getGroupMembersIds: () => Promise.resolve(new Array(200).fill({})),
  };
  const engine = createGroupsSyncEngine(baseOptions(clock));

  const ra = await engine.listGroups('wa_loja', clientA);
  const rb = await engine.listGroups('wa_atend', clientB);

  assert.strictEqual(ra.groups[0].memberCount, 100);
  assert.strictEqual(rb.groups[0].memberCount, 200);
  assert.strictEqual(
    engine._getInternalState('wa_loja').cacheGroups[0].memberCount,
    100,
    'F: cache da sessão A independente'
  );
  assert.strictEqual(
    engine._getInternalState('wa_atend').cacheGroups[0].memberCount,
    200,
    'F: cache da sessão B independente'
  );
}

// G) Dashboard: [100, 200, null] -> total 300, média 150, 2/3 conhecidos.
async function testDashboardStats() {
  const mod = await import('../src/types/whatsApp.ts');
  const stats = mod.computeMemberStats([100, 200, null]);

  assert.strictEqual(stats.totalMembers, 300, 'G: total = 300');
  assert.strictEqual(stats.averageMembers, 150, 'G: média = 150');
  assert.strictEqual(stats.knownGroups, 2, 'G: conhecidos = 2');
  assert.strictEqual(stats.totalGroups, 3, 'G: total = 3');
  assert.strictEqual(
    stats.totalGroups - stats.knownGroups,
    1,
    'G: desconhecidos = 1'
  );
  // Falha (null) não é somada como 0 e não entra na média.
  assert.strictEqual(mod.computeMemberStats([null, null]).totalMembers, 0);
  assert.strictEqual(mod.computeMemberStats([null, null]).averageMembers, null);
  assert.strictEqual(mod.formatMemberCountLabel(1), '1 membro');
  assert.strictEqual(mod.formatMemberCountLabel(247), '247 membros');
  assert.strictEqual(mod.formatMemberCountLabel(null), '— membros');
}

// H) Dedupe por id: mesmo grupo em duas contas conta uma vez, preservando
// a entrada com memberCount conhecido.
async function testDedupeGroupsById() {
  const mod = await import('../src/types/whatsApp.ts');
  const groups = [
    { id: 'a@g.us', name: 'A', memberCount: null, isGroup: true, whatsappAccountId: 's1', sessionId: 's1' },
    { id: 'a@g.us', name: 'A', memberCount: 50, isGroup: true, whatsappAccountId: 's2', sessionId: 's2' },
    { id: 'b@g.us', name: 'B', memberCount: 10, isGroup: true, whatsappAccountId: 's1', sessionId: 's1' },
  ];
  const unique = mod.dedupeGroupsById(groups);
  assert.strictEqual(unique.length, 2, 'H: 2 grupos únicos');
  const a = unique.find((g) => g.id === 'a@g.us');
  assert.strictEqual(a.memberCount, 50, 'H: preserva contagem conhecida');
  const stats = mod.computeGroupMemberStats(unique);
  assert.strictEqual(stats.totalMembers, 60, 'H: membros somados uma vez');
  assert.strictEqual(stats.totalGroups, 2);
}

// Extras de robustez da extração (sem assumir estrutura).
function testExtractMemberCountVariants() {
  assert.strictEqual(extractMemberCount(new Array(7).fill(0)), 7);
  assert.strictEqual(extractMemberCount({ participants: [1, 2, 3] }), 3);
  assert.strictEqual(extractMemberCount({ size: 42 }), 42);
  assert.strictEqual(extractMemberCount({ count: 8 }), 8);
  assert.strictEqual(extractMemberCount(null), null);
  assert.strictEqual(extractMemberCount('nope'), null);
}

async function run() {
  const tests = [
    ['A) participants no payload -> memberCount=35 sem WPP', testPayloadParticipantsPreferred],
    ['B) fallback getGroupMembersIds -> memberCount=120', testFallbackGroupMembersIds],
    ['C) timeout preserva cache anterior (95)', testTimeoutPreservesPreviousCount],
    ['D) timeout sem cache -> null (não 0)', testTimeoutWithoutCacheIsNull],
    ['E) concorrência máxima de 2 getGroupMembersIds', testConcurrencyLimit],
    ['F) duas sessões -> caches independentes', testIndependentSessionsCache],
    ['G) dashboard total/média/conhecidos', testDashboardStats],
    ['H) dedupe de grupos por id', testDedupeGroupsById],
    ['extra) extração tolerante de memberCount', testExtractMemberCountVariants],
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
    console.error(`\nwhatsappMembers: ${failures} falha(s)`);
    process.exit(1);
  }
  console.log(`\nwhatsappMembers: ${tests.length} testes ok, 0 falhas`);
}

run().catch((err) => {
  console.error('whatsappMembers.test.js: FALHOU');
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
