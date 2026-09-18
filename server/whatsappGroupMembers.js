'use strict';

/**
 * Contagem REAL de membros dos grupos WhatsApp.
 *
 * Estratégia:
 *  1. Preferir o que já vem no payload de listChats
 *     (participants / participantCount / groupMetadata).
 *  2. Fallback oficial: client.getGroupMembersIds(groupId) -> quantidade.
 *     Usamos getGroupMembersIds (não getGroupMembers) porque só precisamos da
 *     QUANTIDADE, não dos objetos completos de contato.
 *
 * Disciplina de concorrência (mesma filosofia do whatsappGroups.js):
 *  - Nunca disparar dezenas de consultas ao mesmo tempo.
 *  - Máximo `concurrency` (padrão 2) consultas simultâneas por sessão.
 *  - Cada consulta tem timeout ISOLADO (padrão 6000ms).
 *  - Falha/timeout NUNCA vira 0: mantém o último valor conhecido ou null.
 *    "0 membros" só é aceito quando o WPP respondeu de verdade com lista vazia.
 */

function toSerializedId(id) {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (id._serialized) return id._serialized;
  const user = id.user || (id.id && id.id.user);
  const server = id.server || (id.id && id.id.server);
  if (user && server) return `${user}@${server}`;
  return null;
}

function toCount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.trunc(value);
}

/**
 * Extrai uma quantidade de membros de um valor arbitrário retornado pelo WPP.
 * Nunca assume uma única estrutura; retorna null quando não é possível inferir.
 */
function extractMemberCount(value) {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== 'object') return toCount(value);
  if (Array.isArray(value.participants)) return value.participants.length;
  if (Array.isArray(value.members)) return value.members.length;
  if (Number.isFinite(value.size)) return Math.trunc(value.size);
  if (Number.isFinite(value.count)) return Math.trunc(value.count);
  return null;
}

/**
 * Lê o payload cru de um chat/grupo sem assumir estrutura única.
 * Verifica participantCount, participants e groupMetadata.participants/size.
 *
 * Contagem POSITIVA (> 0) é aceita como confirmação do payload.
 * 0 vindo do payload (participantCount:0, participants:[], groupMetadata.size:0,
 * groupMetadata.participants:[], memberCount etc.) NÃO é confirmação confiável
 * quando usamos ignoreGroupMetadata:true — vira null para o fallback real de
 * getGroupMembersIds() decidir. Somente o retorno REAL de getGroupMembersIds
 * (ex.: []) pode confirmar "0 membros".
 */
function extractMemberCountFromRaw(chat) {
  if (!chat || typeof chat !== 'object') return null;
  const meta = chat.groupMetadata || null;
  const candidates = [
    chat.memberCount,
    chat.participantCount,
    chat.participants,
    meta && meta.size,
    meta && meta.participants,
  ];
  for (const candidate of candidates) {
    const count = extractMemberCount(candidate);
    if (typeof count === 'number' && count > 0) return count;
  }
  return null;
}

// Normaliza um grupo real da API em { id, name, memberCount, isGroup }.
// Campos ausentes viram null. Nenhum valor é inventado.
function normalizeGroupSource(raw) {
  const chat = raw || {};
  const id = toSerializedId(chat.id);
  if (!id || !/^[^\s@]+@g\.us$/i.test(id)) return null;
  const lower = id.toLowerCase();
  if (
    lower === 'status@broadcast' ||
    id.includes('@broadcast') ||
    id.includes('@newsletter')
  ) {
    return null;
  }

  const meta = chat.groupMetadata || null;
  const memberCount = extractMemberCountFromRaw(chat);

  const rawName =
    (typeof chat.name === 'string' && chat.name.trim()) ||
    (typeof chat.formattedTitle === 'string' && chat.formattedTitle.trim()) ||
    (meta && typeof meta.subject === 'string' && meta.subject.trim());
  const name = rawName || null;

  return { id, name, memberCount, isGroup: true };
}

function callWithTimeout(invoke, ms, label) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label || 'chamada WPP'} excedeu ${ms}ms`)),
      ms
    );
  });
  const call = Promise.resolve().then(invoke);
  return Promise.race([call, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Enriquece os grupos com memberCount via getGroupMembersIds, com concorrência
 * limitada e timeout por consulta. Muta os objetos de `groups` no lugar.
 *
 * @param {Array<object>} groups grupos normalizados
 * @param {object} client cliente WPPConnect
 * @param {object} options { timeoutMs, concurrency, previousCounts, log }
 */
async function enrichGroupsMemberCounts(groups, client, options = {}) {
  const list = Array.isArray(groups) ? groups : [];
  if (list.length === 0) return list;
  if (!client || typeof client.getGroupMembersIds !== 'function') return list;

  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 6_000;
  const concurrency = Number.isFinite(options.concurrency)
    ? Math.max(1, Math.trunc(options.concurrency))
    : 2;
  const previousCounts =
    options.previousCounts instanceof Map ? options.previousCounts : new Map();
  const log = typeof options.log === 'function' ? options.log : () => {};

  const pending = list.filter(
    (group) =>
      group && (group.memberCount === null || group.memberCount === undefined)
  );
  if (pending.length === 0) return list;

  let cursor = 0;

  const previousFor = (group) => {
    const value = previousCounts.get(group.id);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  };

  const worker = async () => {
    while (cursor < pending.length) {
      const group = pending[cursor];
      cursor += 1;
      try {
        const value = await callWithTimeout(
          () => client.getGroupMembersIds(group.id),
          timeoutMs,
          `getGroupMembersIds ${group.id}`
        );
        const count = extractMemberCount(value);
        if (count !== null) {
          group.memberCount = count;
          continue;
        }
        // Resposta sem quantidade utilizável: preserva o último valor.
        group.memberCount = previousFor(group);
        log(
          `[WhatsApp] memberCount sem quantidade utilizável para ${group.id} - mantido ${group.memberCount}`
        );
      } catch {
        // Timeout/erro isolado: NUNCA zerar, preservar o último valor conhecido.
        group.memberCount = previousFor(group);
        log(
          `[WhatsApp] memberCount indisponível para ${group.id} - mantido ${group.memberCount}`
        );
      }
    }
  };

  const workers = [];
  const workerCount = Math.min(concurrency, pending.length);
  for (let i = 0; i < workerCount; i += 1) workers.push(worker());
  await Promise.all(workers);
  return list;
}

module.exports = {
  toSerializedId,
  extractMemberCount,
  extractMemberCountFromRaw,
  normalizeGroupSource,
  enrichGroupsMemberCounts,
};
