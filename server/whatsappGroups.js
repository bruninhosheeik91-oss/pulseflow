'use strict';

/**
 * Motor de sincronização de grupos WhatsApp.
 *
 * Objetivo: NUNCA empilhar chamadas WPP quando o runtime está lento.
 *
 * Regras centrais:
 *  - Após chegar em CONNECTED/MAIN há um WARM-UP: nenhuma chamada WPP de
 *    grupos é feita durante a janela (a UI mostra "finalizando sincronização").
 *  - listChats é a estratégia PRINCIPAL, com timeout próprio.
 *  - TIMEOUT de listChats NÃO autoriza fallback: getAllGroups/getAllChats
 *    ficam PROIBIDOS naquele ciclo (evita congestionar o runtime/WAPI).
 *  - Fallbacks só rodam quando listChats não existe, falha rápido (erro
 *    explícito/síncrono) ou devolve vazio válido (runtime respondeu = estável).
 *  - SINGLE-FLIGHT REAL: a Promise WPP original é referenciada. Enquanto ela
 *    não resolver/rejeitar, nenhuma nova chamada WPP de grupos é iniciada —
 *    mesmo que o timeout lógico/HTTP já tenha estourado. Após ~60s a operação
 *    é considerada órfã e liberada.
 */

const {
  enrichGroupsMemberCounts: defaultEnrichMemberCounts,
} = require('./whatsappGroupMembers.js');

class WppCallTimeoutError extends Error {
  constructor(label, ms) {
    super(`${label || 'chamada WPP'} excedeu o limite de ${ms}ms`);
    this.name = 'WppCallTimeoutError';
    this.kind = 'timeout';
    this.label = label || null;
    this.ms = ms;
  }
}

function defaultSortGroups(a, b) {
  const an = a.name || '';
  const bn = b.name || '';
  return an.localeCompare(bn, 'pt-BR') || String(a.id).localeCompare(String(b.id));
}

function createGroupsSyncEngine(options = {}) {
  const warmupMs = Number.isFinite(options.warmupMs) ? options.warmupMs : 15_000;
  const listChatsTimeoutMs = Number.isFinite(options.listChatsTimeoutMs)
    ? options.listChatsTimeoutMs
    : 15_000;
  const fallbackTimeoutMs = Number.isFinite(options.fallbackTimeoutMs)
    ? options.fallbackTimeoutMs
    : 3_000;
  const timeoutRetryMs = Number.isFinite(options.timeoutRetryMs)
    ? options.timeoutRetryMs
    : 12_000;
  const orphanMs = Number.isFinite(options.orphanMs) ? options.orphanMs : 60_000;
  const cacheTtlMs = Number.isFinite(options.cacheTtlMs) ? options.cacheTtlMs : 5_000;
  // Contagem de membros: fallback getGroupMembersIds com concorrência limitada.
  const memberCountTimeoutMs = Number.isFinite(options.memberCountTimeoutMs)
    ? options.memberCountTimeoutMs
    : 6_000;
  const memberCountConcurrency = Number.isFinite(options.memberCountConcurrency)
    ? Math.max(1, Math.trunc(options.memberCountConcurrency))
    : 2;
  const enrichMemberCounts =
    typeof options.enrichMemberCounts === 'function'
      ? options.enrichMemberCounts
      : defaultEnrichMemberCounts;

  const now = typeof options.now === 'function' ? options.now : () => Date.now();
  const normalizeGroupSource =
    typeof options.normalizeGroupSource === 'function'
      ? options.normalizeGroupSource
      : (raw) => raw;
  const log = typeof options.log === 'function' ? options.log : () => {};
  const logError = typeof options.logError === 'function' ? options.logError : () => {};
  const loadPersistedSnapshot =
    typeof options.loadPersistedSnapshot === 'function'
      ? options.loadPersistedSnapshot
      : () => null;
  const persistSnapshot =
    typeof options.persistSnapshot === 'function' ? options.persistSnapshot : () => {};
  const sortGroups = typeof options.sortGroups === 'function' ? options.sortGroups : defaultSortGroups;

  // sessionId -> { warmupUntil, retryAfterAt, realOp, attempt, cacheGroups, cacheAt, diskChecked }
  const states = new Map();

  function internal(sessionId) {
    let s = states.get(sessionId);
    if (!s) {
      s = {
        warmupUntil: 0,
        retryAfterAt: 0,
        realOp: null,
        attempt: null,
        cacheGroups: null,
        cacheAt: 0,
        // Momento REAL do snapshot de grupos (epoch ms): do arquivo persistido
        // ou da última listagem WPP bem-sucedida. NUNCA é atualizado ao apenas
        // ler o cache — evita sugerir sincronização recente sem sincronizar.
        cacheSyncedAt: null,
        diskChecked: false,
      };
      states.set(sessionId, s);
    }
    return s;
  }

  function makeResult(status, extra) {
    return Object.assign(
      {
        status,
        groups: [],
        cached: false,
        warmingUp: false,
        syncInProgress: false,
        runtimeTimeout: false,
        retryAfterMs: 0,
        syncedAt: null,
      },
      extra || {}
    );
  }

  // ISO do snapshot real (arquivo persistido ou última listagem WPP). null
  // quando desconhecido — nunca inventa "agora" só por ler o cache.
  function syncedAtIso(sessionId) {
    const s = internal(sessionId);
    const at = s.cacheSyncedAt;
    if (!at) return null;
    try {
      return new Date(at).toISOString();
    } catch {
      return null;
    }
  }

  function withSyncedAt(sessionId, result) {
    result.syncedAt = syncedAtIso(sessionId);
    return result;
  }

  function parseGroups(value, filterGroupUs) {
    const list = Array.isArray(value) ? value : [];
    return list
      .filter(
        (item) =>
          !filterGroupUs ||
          (item && (item.isGroup || /@g\.us$/i.test(String(item.id || ''))))
      )
      .map(normalizeGroupSource)
      .filter((group) => group && group.id)
      .sort(sortGroups);
  }

  function cachedGroups(sessionId) {
    const s = internal(sessionId);
    if (s.cacheAt && Array.isArray(s.cacheGroups) && s.cacheGroups.length > 0) {
      return s.cacheGroups;
    }
    if (!s.diskChecked) {
      s.diskChecked = true;
      try {
        const persisted = loadPersistedSnapshot(sessionId);
        // Contrato novo: { groups, syncedAt }. Contrato antigo: array puro.
        const persistedGroups = Array.isArray(persisted)
          ? persisted
          : persisted && Array.isArray(persisted.groups)
          ? persisted.groups
          : null;
        const persistedAt = Array.isArray(persisted)
          ? null
          : persisted && persisted.syncedAt;
        if (Array.isArray(persistedGroups) && persistedGroups.length > 0) {
          s.cacheGroups = persistedGroups;
          s.cacheAt = now();
          if (Number.isFinite(persistedAt)) s.cacheSyncedAt = persistedAt;
          return persistedGroups;
        }
      } catch {
        // melhor esforço
      }
    }
    return [];
  }

  /**
   * Executa a chamada WPP real guardando a referência da Promise ORIGINAL.
   * Um timeout lógico NÃO cancela a operação (WPP/WAPI não suporta cancel).
   */
  async function invokeWithTimeout(sessionId, invoke, ms, label) {
    const s = internal(sessionId);
    let raw;
    try {
      raw = Promise.resolve(invoke());
    } catch (err) {
      return { ok: false, timedOut: false, error: err, value: undefined };
    }

    const op = { startedAt: now(), settled: false };
    s.realOp = op;
    raw.then(
      () => {
        op.settled = true;
      },
      () => {
        op.settled = true;
      }
    );

    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new WppCallTimeoutError(label, ms)), ms);
    });
    try {
      const value = await Promise.race([raw, timeoutPromise]);
      return { ok: true, timedOut: false, value };
    } catch (err) {
      if (err instanceof WppCallTimeoutError) {
        return { ok: false, timedOut: true, error: err };
      }
      return { ok: false, timedOut: false, error: err };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // Fallbacks depreciados. Qualquer TIMEOUT encerra a cadeia imediatamente.
  async function runFallbackChain(sessionId, client, methods) {
    let groups = [];
    for (const method of methods) {
      if (!client || typeof client[method] !== 'function') {
        log(`[${sessionId}] ${method} indisponível - próximo fallback`);
        continue;
      }
      const invoke =
        method === 'getAllGroups'
          ? () => client.getAllGroups(false)
          : () => client.getAllChats();
      const out = await invokeWithTimeout(
        sessionId,
        invoke,
        fallbackTimeoutMs,
        `${method} (${sessionId})`
      );
      if (out.timedOut) {
        log(
          `[WhatsApp] ${method} timeout - fallback cancelado para não empilhar chamadas WPP (${sessionId})`
        );
        return { groups: [], timedOut: true };
      }
      if (out.ok) {
        const parsed = parseGroups(out.value, method === 'getAllChats');
        if (parsed.length > 0) {
          groups = parsed;
          log(`[${sessionId}] grupos via ${method} = ${parsed.length}`);
          break;
        }
      }
    }
    return { groups, timedOut: false };
  }

  /**
   * Enriquecimento de memberCount por grupo, com concorrência limitada.
   *  - Usa o último snapshot como "valores anteriores" para preservar a
   *    contagem quando o WPP falha/timeout (nunca sobrescreve número por 0/null).
   *  - Nunca derruba a sincronização: qualquer falha é absorvida.
   */
  async function enrichGroups(sessionId, client, groups) {
    if (!Array.isArray(groups) || groups.length === 0) return groups;
    const s = internal(sessionId);
    const prior = Array.isArray(s.cacheGroups) ? s.cacheGroups : [];
    const previousCounts = new Map();
    for (const group of prior) {
      if (group && typeof group.memberCount === 'number') {
        previousCounts.set(group.id, group.memberCount);
      }
    }
    try {
      await enrichMemberCounts(groups, client, {
        previousCounts,
        timeoutMs: memberCountTimeoutMs,
        concurrency: memberCountConcurrency,
        log,
      });
    } catch (err) {
      logError(`[${sessionId}] falha no enriquecimento de membros: ${String(err)}`);
    }
    // Garante preservação mesmo quando o cliente não expõe getGroupMembersIds.
    for (const group of groups) {
      if (
        group &&
        (group.memberCount === null || group.memberCount === undefined)
      ) {
        const previous = previousCounts.get(group.id);
        group.memberCount = typeof previous === 'number' ? previous : null;
      }
    }
    return groups;
  }

  async function runAttempt(sessionId, client) {
    const s = internal(sessionId);
    let groups = [];
    let timedOut = false;
    let fallbackAllowed = false;
    let fallbackReason = '';

    if (!client || typeof client.listChats !== 'function') {
      fallbackAllowed = true;
      fallbackReason = 'listChats ausente';
      log(`[${sessionId}] listChats indisponível - fallback permitido`);
    } else {
      const out = await invokeWithTimeout(
        sessionId,
        () => client.listChats({ onlyGroups: true, ignoreGroupMetadata: true }),
        listChatsTimeoutMs,
        `listChats (${sessionId})`
      );
      if (out.timedOut) {
        // Runtime ocupado/lento: PROIBIDO iniciar outro método WPP neste ciclo.
        timedOut = true;
        log(
          `[WhatsApp] listChats timeout - fallback cancelado para não empilhar chamadas WPP (${sessionId})`
        );
      } else if (out.ok) {
        const parsed = parseGroups(out.value, false);
        if (parsed.length > 0) {
          groups = parsed;
          log(`[${sessionId}] grupos via listChats = ${parsed.length}`);
        } else {
          // Resposta válida vazia: o runtime respondeu (estável) -> fallback ok.
          fallbackAllowed = true;
          fallbackReason = 'listChats vazio válido';
        }
      } else {
        // Erro rápido/explicito: incompatibilidade comprovada -> fallback ok.
        fallbackAllowed = true;
        fallbackReason = 'listChats erro rápido';
      }
    }

    if (fallbackAllowed && groups.length === 0) {
      log(`[${sessionId}] fallback de grupos (${fallbackReason})`);
      const fb = await runFallbackChain(sessionId, client, [
        'getAllGroups',
        'getAllChats',
      ]);
      groups = fb.groups;
      timedOut = timedOut || fb.timedOut;
    }

    if (groups.length > 0) {
      // memberCount REAL: tenta o payload de listChats e cai para
      // getGroupMembersIds com concorrência limitada (máx. 2 por sessão).
      groups = await enrichGroups(sessionId, client, groups);
      s.cacheGroups = groups;
      s.cacheAt = now();
      s.cacheSyncedAt = s.cacheAt;
      s.retryAfterAt = 0;
      try {
        persistSnapshot(sessionId, groups);
      } catch {
        // persistência é melhor esforço
      }
      log(`[${sessionId}] listagem de grupos concluída (${groups.length})`);
      return makeResult('ok', { groups, cached: false });
    }

    if (timedOut) {
      s.retryAfterAt = now() + timeoutRetryMs;
      const cached = cachedGroups(sessionId);
      if (cached.length > 0) {
        log(
          `[${sessionId}] listagem de grupos timeout - usando cache ${cached.length} (retry em ${timeoutRetryMs}ms)`
        );
        return makeResult('ok', {
          groups: cached,
          cached: true,
          retryAfterMs: timeoutRetryMs,
        });
      }
      log(`[${sessionId}] listagem de grupos falhou: timeout sem cache válido`);
      return makeResult('timeout', {
        groups: [],
        runtimeTimeout: true,
        retryAfterMs: timeoutRetryMs,
      });
    }

    // Resposta válida porém sem grupos (runtime respondeu): NÃO é timeout.
    log(`[${sessionId}] listagem de grupos concluída (0)`);
    return makeResult('ok', { groups: [], cached: false });
  }

  /**
   * Entrada única. Sempre resolve com um resultado tipado; nunca lança.
   */
  async function listGroups(sessionId, client) {
    if (!sessionId) return makeResult('ok', { groups: [] });
    const s = internal(sessionId);
    const t = now();

    // 1) Warm-up pós-login: não tocar no WPP de forma alguma.
    if (s.warmupUntil && t < s.warmupUntil) {
      const groups = cachedGroups(sessionId);
      return withSyncedAt(
        sessionId,
        makeResult('warming', {
          groups,
          cached: groups.length > 0,
          warmingUp: true,
          retryAfterMs: s.warmupUntil - t,
        })
      );
    }

    // 2) Operação WPP REAL ainda viva: jamais iniciar outra (single-flight real).
    if (s.realOp && !s.realOp.settled) {
      const age = t - s.realOp.startedAt;
      if (age < orphanMs) {
        const groups = cachedGroups(sessionId);
        return withSyncedAt(
          sessionId,
          makeResult('syncing', {
            groups,
            cached: groups.length > 0,
            syncInProgress: true,
            retryAfterMs: Math.max(1, orphanMs - age),
          })
        );
      }
      // Órfã (passou do limite de segurança): libera para nova tentativa.
      log(
        `[${sessionId}] operação WPP de grupos órfã (>${orphanMs}ms) - liberando nova tentativa`
      );
      s.realOp = null;
    }

    // 3) Backoff controlado após timeout (10-15s), sem empilhar.
    if (s.retryAfterAt && t < s.retryAfterAt) {
      const retryAfterMs = s.retryAfterAt - t;
      const groups = cachedGroups(sessionId);
      if (groups.length > 0) {
        return withSyncedAt(
          sessionId,
          makeResult('ok', { groups, cached: true, retryAfterMs })
        );
      }
      return withSyncedAt(
        sessionId,
        makeResult('timeout', {
          groups: [],
          runtimeTimeout: true,
          retryAfterMs,
        })
      );
    }

    // 4) Cache fresco: responde sem consultar o WPP.
    if (s.cacheAt && t - s.cacheAt < cacheTtlMs) {
      return withSyncedAt(
        sessionId,
        makeResult('ok', {
          groups: Array.isArray(s.cacheGroups) ? s.cacheGroups : [],
          cached: true,
        })
      );
    }

    // 5) Single-flight de tentativa HTTP concorrente.
    if (s.attempt) return withSyncedAt(sessionId, await s.attempt);

    const attempt = runAttempt(sessionId, client);
    s.attempt = attempt;
    try {
      return withSyncedAt(sessionId, await attempt);
    } finally {
      if (s.attempt === attempt) s.attempt = null;
    }
  }

  function noteConnected(sessionId) {
    if (!sessionId) return;
    const s = internal(sessionId);
    s.warmupUntil = now() + warmupMs;
    s.retryAfterAt = 0;
    log(
      `[${sessionId}] warm-up de grupos iniciado (${Math.round(
        warmupMs / 1000
      )}s) - sem chamadas WPP até então`
    );
  }

  function noteDisconnected(sessionId) {
    const s = states.get(sessionId);
    if (!s) return;
    s.warmupUntil = 0;
    s.retryAfterAt = 0;
    s.attempt = null;
    s.realOp = null;
  }

  function seedCache(sessionId, groups, syncedAt) {
    if (!sessionId || !Array.isArray(groups) || groups.length === 0) return;
    const s = internal(sessionId);
    s.cacheGroups = groups;
    s.cacheAt = now();
    s.diskChecked = true;
    // syncedAt vem do arquivo persistido (epoch ms). Sem ele, mantém null para
    // não sugerir uma sincronização que nunca aconteceu.
    if (Number.isFinite(syncedAt)) s.cacheSyncedAt = syncedAt;
  }

  /**
   * Leitura cache-only (arquivo persistido ou memória): NUNCA toca no WPP.
   * Retorna o último snapshot conhecido e o instante REAL em que foi gerado.
   */
  function getCachedGroups(sessionId) {
    if (!sessionId) return { groups: [], syncedAt: null };
    const groups = cachedGroups(sessionId);
    return {
      groups: Array.isArray(groups) ? groups : [],
      syncedAt: syncedAtIso(sessionId),
    };
  }

  function _getInternalState(sessionId) {
    return internal(sessionId);
  }

  function _reset(sessionId) {
    if (sessionId) states.delete(sessionId);
    else states.clear();
  }

  return {
    listGroups,
    getCachedGroups,
    noteConnected,
    noteDisconnected,
    seedCache,
    WppCallTimeoutError,
    _getInternalState,
    _reset,
  };
}

module.exports = { createGroupsSyncEngine, WppCallTimeoutError };
