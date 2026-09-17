import { afterEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'domnex.whatsapp.groups.v1';

interface StoredGroup {
  id: string;
  name: string;
  memberCount: number;
  isGroup: true;
  whatsappAccountId: string;
  sessionId: string;
}

const PARENT: StoredGroup = {
  id: '111@g.us',
  name: 'Mae',
  memberCount: 5,
  isGroup: true,
  whatsappAccountId: 'main',
  sessionId: 'main',
};
const CHILD: StoredGroup = {
  id: '222@g.us',
  name: 'Filho',
  memberCount: 3,
  isGroup: true,
  whatsappAccountId: 'main',
  sessionId: 'main',
};

function installWindow(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const localStorage = {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
  };
  vi.stubGlobal('window', { localStorage });
}

const STATUS_PAYLOAD = {
  ok: true,
  session: 'main',
  connected: true,
  enabled: true,
  parentGroupId: null,
  childGroupIds: [],
  lastMessageAt: null,
  lastMessageId: null,
  lastSendAt: null,
  lastSendMessageId: null,
  lastError: null,
};

function mockFetch() {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => STATUS_PAYLOAD,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

type FetchMock = ReturnType<typeof mockFetch>;

function monitorBodies(fn: FetchMock): Record<string, unknown>[] {
  return fn.mock.calls
    .filter(([url]) => /\/api\/monitor$/.test(String(url)))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

function lastBody(fn: FetchMock): Record<string, unknown> {
  const all = monitorBodies(fn);
  return all[all.length - 1];
}

async function configWithParentAndChild() {
  const store = await import('./groupConfigStore');
  store.setSyncedGroupsForSession([PARENT, CHILD], 'main');
  store.setParentGroup(PARENT.id);
  store.addChildGroup(CHILD.id);
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('groupConfigStore - estado do monitor', () => {
  it('mãe + destino ativa o monitor (enabled:true)', async () => {
    installWindow();
    const fetchFn = mockFetch();
    const store = await configWithParentAndChild();

    await vi.waitFor(() => {
      expect(lastBody(fetchFn)?.enabled).toBe(true);
    });
    expect(lastBody(fetchFn).parentGroupId).toBe(PARENT.id);
    expect(lastBody(fetchFn).childGroupIds).toEqual([CHILD.id]);
    expect(store.getGroupConfig().monitorEnabled).toBeNull();
  });

  it('sem mãe + destino mantém enabled:false', async () => {
    installWindow();
    const fetchFn = mockFetch();
    const store = await import('./groupConfigStore');
    store.setSyncedGroupsForSession([PARENT, CHILD], 'main');

    await vi.waitFor(() => {
      expect(fetchFn).toHaveBeenCalled();
    });
    expect(lastBody(fetchFn).enabled).toBe(false);
  });

  it('pausar envia enabled:false e persiste a intenção', async () => {
    installWindow();
    const fetchFn = mockFetch();
    const store = await configWithParentAndChild();
    await vi.waitFor(() => expect(lastBody(fetchFn)?.enabled).toBe(true));

    const callsBefore = fetchFn.mock.calls.length;
    await store.setMonitorEnabled(false);

    expect(fetchFn.mock.calls.length).toBe(callsBefore + 1);
    expect(lastBody(fetchFn).enabled).toBe(false);
    expect(store.getGroupConfig().monitorEnabled).toBe(false);
  });

  it('retomar envia enabled:true com mãe + destino', async () => {
    installWindow();
    const fetchFn = mockFetch();
    const store = await configWithParentAndChild();
    await store.setMonitorEnabled(false);
    await store.setMonitorEnabled(true);

    expect(lastBody(fetchFn).enabled).toBe(true);
    expect(store.getGroupConfig().monitorEnabled).toBe(true);
  });

  it('reload mantém o estado real do servidor (pausa não é revertida)', async () => {
    const stored = JSON.stringify({
      groups: [PARENT, CHILD],
      syncedAt: '2026-01-01T00:00:00.000Z',
      syncedAtBySession: { main: '2026-01-01T00:00:00.000Z' },
      parentGroupId: PARENT.id,
      parentSessionId: 'main',
      childGroupIds: [CHILD.id],
      childGroupDelays: { [CHILD.id]: 30 },
      monitorEnabled: false,
    });
    installWindow({ [STORAGE_KEY]: stored });
    const fetchFn = mockFetch();

    const store = await import('./groupConfigStore');
    expect(store.getGroupConfig().monitorEnabled).toBe(false);

    // Qualquer sincronização após o reload deve preservar a pausa.
    store.setChildGroupDelay(CHILD.id, 45);
    await vi.waitFor(() => expect(fetchFn).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lastBody(fetchFn).enabled).toBe(false);
    expect(lastBody(fetchFn).childGroupIds).toEqual([CHILD.id]);
  });
});
