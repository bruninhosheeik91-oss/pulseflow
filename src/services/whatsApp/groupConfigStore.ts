import { useSyncExternalStore } from 'react';
import {
  WhatsAppGroup,
  DOMNEX_DEFAULT_SESSION_ID,
} from '../../types/whatsApp';
import { updateMonitorServerConfig } from './monitorService';
import { CachedGroupsSnapshot } from './provider';

const STORAGE_KEY = 'domnex.whatsapp.groups.v1';
export const DEFAULT_CHANNEL_ANTIFLOOD_SECONDS = 30;

export interface WhatsAppGroupConfig {
  groups: WhatsAppGroup[];
  /** Instante da sincronização mais recente entre todas as contas. */
  syncedAt: string | null;
  /** Instante REAL de sincronização por conta (sessionId). */
  syncedAtBySession: Record<string, string | null>;
  parentGroupId: string | null;
  parentSessionId: string | null;
  childGroupIds: string[];
  childGroupDelays: Record<string, number>;
}

const EMPTY_CONFIG: WhatsAppGroupConfig = {
  groups: [],
  syncedAt: null,
  syncedAtBySession: {},
  parentGroupId: null,
  parentSessionId: null,
  childGroupIds: [],
  childGroupDelays: {},
};

function normalizeSyncedAtMap(value: unknown): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  if (!value || typeof value !== 'object') return result;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!key) continue;
    if (typeof raw === 'string') result[key] = raw;
    else if (raw === null) result[key] = null;
  }
  return result;
}

// Instante mais recente do mapa por conta. É o valor exibido no cabeçalho;
// a precisão por conta fica em syncedAtBySession.
function latestSyncedAt(map: Record<string, string | null>): string | null {
  let latest: string | null = null;
  let latestMs = -Infinity;
  for (const value of Object.values(map)) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (Number.isFinite(ms) && ms >= latestMs) {
      latestMs = ms;
      latest = value;
    }
  }
  return latest;
}

function normalizeDelay(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_CHANNEL_ANTIFLOOD_SECONDS;
  return Math.min(3600, Math.max(0, Math.round(number)));
}

function isWhatsAppGroup(value: unknown): value is WhatsAppGroup {
  if (!value || typeof value !== 'object') return false;
  const g = value as Record<string, unknown>;
  const hasMemberCount =
    g.memberCount === undefined ||
    g.memberCount === null ||
    typeof g.memberCount === 'number';
  const hasLegacyCount =
    g.participantCount === undefined ||
    g.participantCount === null ||
    typeof g.participantCount === 'number';
  return (
    typeof g.id === 'string' &&
    Boolean(g.id) &&
    (g.name === null || typeof g.name === 'string') &&
    hasMemberCount &&
    hasLegacyCount &&
    g.isGroup === true &&
    (g.whatsappAccountId === null || typeof g.whatsappAccountId === 'string') &&
    (g.sessionId === null || typeof g.sessionId === 'string')
  );
}

// Migra snapshots antigos em localStorage (participantCount -> memberCount),
// sem descartar grupos válidos nem perder contagens.
function migrateStoredGroup(value: unknown): WhatsAppGroup | null {
  if (!isWhatsAppGroup(value)) return null;
  const legacy = value as WhatsAppGroup & { participantCount?: number | null };
  const memberCount =
    typeof value.memberCount === 'number'
      ? value.memberCount
      : typeof legacy.participantCount === 'number'
      ? legacy.participantCount
      : null;
  return {
    id: value.id,
    name: value.name,
    memberCount,
    isGroup: true,
    whatsappAccountId: value.whatsappAccountId,
    sessionId: value.sessionId,
  };
}

function readFromStorage(): WhatsAppGroupConfig {
  if (typeof window === 'undefined') return EMPTY_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CONFIG;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const groups = Array.isArray(parsed.groups)
      ? parsed.groups
          .map(migrateStoredGroup)
          .filter((group): group is WhatsAppGroup => group !== null)
      : [];
    const ids = new Set(groups.map((g) => g.id));
    const parentGroupId =
      typeof parsed.parentGroupId === 'string' && ids.has(parsed.parentGroupId)
        ? parsed.parentGroupId
        : null;
    const parentGroup = groups.find((g) => g.id === parentGroupId) ?? null;
    const parentSessionId =
      typeof parsed.parentSessionId === 'string'
        ? parsed.parentSessionId
        : parentGroup?.sessionId ?? null;
    const childGroupIds = Array.isArray(parsed.childGroupIds)
      ? parsed.childGroupIds.filter(
          (id): id is string =>
            typeof id === 'string' &&
            ids.has(id) &&
            id !== parentGroupId &&
            (!parentSessionId
              ? Boolean(groups.find((g) => g.id === id)?.sessionId === null)
              : groups.find((g) => g.id === id)?.sessionId === parentSessionId)
        )
      : [];

    const storedDelays =
      parsed.childGroupDelays && typeof parsed.childGroupDelays === 'object'
        ? (parsed.childGroupDelays as Record<string, unknown>)
        : {};
    const childGroupDelays: Record<string, number> = {};
    for (const group of groups) {
      childGroupDelays[group.id] = normalizeDelay(storedDelays[group.id]);
    }

    const syncedAtBySession = normalizeSyncedAtMap(parsed.syncedAtBySession);
    const storedSyncedAt =
      typeof parsed.syncedAt === 'string' ? parsed.syncedAt : null;

    return {
      groups,
      syncedAt: latestSyncedAt(syncedAtBySession) ?? storedSyncedAt,
      syncedAtBySession,
      parentGroupId,
      parentSessionId,
      childGroupIds,
      childGroupDelays,
    };
  } catch {
    return EMPTY_CONFIG;
  }
}

let state: WhatsAppGroupConfig = readFromStorage();
const listeners = new Set<() => void>();

function persist() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // armazenamento indisponível: mantém apenas o estado em memória
  }
}

function commit(next: WhatsAppGroupConfig) {
  state = next;
  persist();
  listeners.forEach((listener) => listener());
  void syncMonitorServerConfig();
}

function activeChildDelays(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of state.childGroupIds) {
    result[id] = normalizeDelay(state.childGroupDelays[id]);
  }
  return result;
}

// Espelha Grupo Mãe, destinos e anti-flood no backend real do monitor.
function syncMonitorServerConfig() {
  try {
    void updateMonitorServerConfig({
      sessionId: state.parentSessionId ?? DOMNEX_DEFAULT_SESSION_ID,
      parentGroupId: state.parentGroupId,
      childGroupIds: state.childGroupIds,
      childGroupDelays: activeChildDelays(),
    }).catch(() => {
      // backend indisponível; sincronização refeita na próxima alteração
    });
  } catch {
    // nenhuma alteração de seleção pode ser bloqueada por falha de rede
  }
}

export function getGroupConfig(): WhatsAppGroupConfig {
  return state;
}

export function getChildGroupDelay(id: string): number {
  return normalizeDelay(state.childGroupDelays[id]);
}

export function setChildGroupDelay(id: string, seconds: number) {
  if (!state.groups.some((group) => group.id === id)) return;
  commit({
    ...state,
    childGroupDelays: {
      ...state.childGroupDelays,
      [id]: normalizeDelay(seconds),
    },
  });
}

function tagGroupsWithSession(
  groups: WhatsAppGroup[],
  sessionId: string
): WhatsAppGroup[] {
  return groups
    .filter((g) => g && typeof g.id === 'string' && Boolean(g.id))
    .map((g) => ({
      ...g,
      whatsappAccountId: sessionId,
      sessionId,
    }));
}

// Reconstrói a configuração preservando Grupo Mãe/Filho e anti-flood a partir
// do conjunto de grupos informado + timestamps por conta.
function buildConfigWithGroups(
  nextGroups: WhatsAppGroup[],
  syncedAtBySession: Record<string, string | null>
): WhatsAppGroupConfig {
  const ids = new Set(nextGroups.map((g) => g.id));
  const parentGroupId =
    state.parentGroupId && ids.has(state.parentGroupId)
      ? state.parentGroupId
      : null;
  const parentGroup = nextGroups.find((g) => g.id === parentGroupId) ?? null;
  const parentSessionId = parentGroup?.sessionId ?? null;
  const childGroupIds = state.childGroupIds.filter(
    (id) =>
      ids.has(id) &&
      id !== parentGroupId &&
      nextGroups.find((g) => g.id === id)?.sessionId === parentSessionId
  );
  const childGroupDelays: Record<string, number> = {};
  for (const group of nextGroups) {
    childGroupDelays[group.id] = normalizeDelay(state.childGroupDelays[group.id]);
  }
  return {
    groups: nextGroups,
    syncedAt: latestSyncedAt(syncedAtBySession),
    syncedAtBySession,
    parentGroupId,
    parentSessionId,
    childGroupIds,
    childGroupDelays,
  };
}

export function setSyncedGroupsForSession(
  groups: WhatsAppGroup[],
  sessionId: string,
  syncedAt: string = new Date().toISOString()
) {
  const valid = tagGroupsWithSession(groups, sessionId);
  // Resultado vazio (WPP travado/timeout/sem grupos) NUNCA apaga grupos já
  // persistidos nem a configuração monitor (Grupo Mãe/Filho). A sincronização
  // falhar não pode limpar a seleção do usuário.
  if (valid.length === 0) return;
  const others = state.groups.filter((g) => g.sessionId !== sessionId);
  const nextGroups = [...others, ...valid];
  commit(
    buildConfigWithGroups(nextGroups, {
      ...state.syncedAtBySession,
      [sessionId]: syncedAt,
    })
  );
}

/**
 * Hidrata a configuração com os snapshots REAIS que o servidor já conhece
 * (rota cache-only). Substitui os grupos de uma conta apenas quando o servidor
 * tem uma versão mais recente do que a registrada localmente — nunca rebaixa
 * dados mais novos nem inventa timestamps.
 */
export function applyServerSnapshots(snapshots: CachedGroupsSnapshot[]) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return;
  let nextGroups = [...state.groups];
  const nextSyncedAtBySession = { ...state.syncedAtBySession };
  let changed = false;

  for (const snapshot of snapshots) {
    if (!snapshot || !snapshot.sessionId || !Array.isArray(snapshot.groups)) {
      continue;
    }
    const valid = tagGroupsWithSession(snapshot.groups, snapshot.sessionId);
    if (valid.length === 0) continue;

    const localAt = state.syncedAtBySession[snapshot.sessionId] ?? null;
    const serverAt = snapshot.syncedAt ?? null;
    const localMs = localAt ? new Date(localAt).getTime() : NaN;
    const serverMs = serverAt ? new Date(serverAt).getTime() : NaN;
    // Sem timestamp local: aceita o snapshot do servidor. Com timestamp local:
    // só substitui se o servidor tiver uma versão comprovadamente mais recente.
    const shouldApply =
      !Number.isFinite(localMs) ||
      (Number.isFinite(serverMs) && serverMs > localMs);
    if (!shouldApply) continue;

    nextGroups = [
      ...nextGroups.filter((g) => g.sessionId !== snapshot.sessionId),
      ...valid,
    ];
    nextSyncedAtBySession[snapshot.sessionId] = serverAt;
    changed = true;
  }

  if (!changed) return;
  commit(buildConfigWithGroups(nextGroups, nextSyncedAtBySession));
}

export function setSyncedGroups(
  groups: WhatsAppGroup[],
  syncedAt: string = new Date().toISOString()
) {
  setSyncedGroupsForSession(groups, DOMNEX_DEFAULT_SESSION_ID, syncedAt);
}

export function setParentGroup(id: string | null) {
  if (id === null) {
    commit({ ...state, parentGroupId: null, parentSessionId: null });
    return;
  }
  const group = state.groups.find((g) => g.id === id);
  if (!group) return;
  const sessionId = group.sessionId ?? DOMNEX_DEFAULT_SESSION_ID;
  commit({
    ...state,
    parentGroupId: id,
    parentSessionId: sessionId,
    childGroupIds: state.childGroupIds.filter(
      (child) =>
        child !== id &&
        state.groups.find((g) => g.id === child)?.sessionId === sessionId
    ),
  });
}

export function addChildGroup(id: string) {
  const group = state.groups.find((g) => g.id === id);
  if (!group) return;
  if (id === state.parentGroupId) return;
  if (!state.parentSessionId || group.sessionId !== state.parentSessionId) return;
  if (state.childGroupIds.includes(id)) return;
  commit({
    ...state,
    childGroupIds: [...state.childGroupIds, id],
    childGroupDelays: {
      ...state.childGroupDelays,
      [id]: normalizeDelay(state.childGroupDelays[id]),
    },
  });
}

export function removeChildGroup(id: string) {
  commit({
    ...state,
    childGroupIds: state.childGroupIds.filter((child) => child !== id),
  });
}

export function replaceChildGroups(ids: string[]) {
  const unique = Array.from(new Set(ids));
  const valid = unique.filter(
    (id) =>
      id !== state.parentGroupId &&
      state.groups.some(
        (g) => g.id === id && g.sessionId === state.parentSessionId
      )
  );
  commit({ ...state, childGroupIds: valid });
}

export function clearGroupSelection() {
  commit({
    ...state,
    parentGroupId: null,
    parentSessionId: null,
    childGroupIds: [],
  });
}

export function clearGroupsForSession(sessionId: string) {
  const removedIds = new Set(
    state.groups.filter((g) => g.sessionId === sessionId).map((g) => g.id)
  );
  const remaining = state.groups.filter((g) => g.sessionId !== sessionId);
  const ids = new Set(remaining.map((g) => g.id));
  const childGroupDelays = Object.fromEntries(
    Object.entries(state.childGroupDelays).filter(([id]) => !removedIds.has(id))
  );
  const syncedAtBySession = { ...state.syncedAtBySession };
  delete syncedAtBySession[sessionId];
  commit({
    groups: remaining,
    syncedAt: latestSyncedAt(syncedAtBySession),
    syncedAtBySession,
    parentGroupId:
      state.parentGroupId && ids.has(state.parentGroupId)
        ? state.parentGroupId
        : null,
    parentSessionId:
      state.parentSessionId &&
      remaining.some((g) => g.sessionId === state.parentSessionId)
        ? state.parentSessionId
        : null,
    childGroupIds: state.childGroupIds.filter((id) => ids.has(id)),
    childGroupDelays,
  });
}

export function subscribeGroupConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useWhatsAppGroupConfig(): WhatsAppGroupConfig {
  return useSyncExternalStore(subscribeGroupConfig, getGroupConfig);
}
