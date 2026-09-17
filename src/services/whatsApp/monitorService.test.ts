import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getMonitorStatus,
  updateMonitorServerConfig,
} from './monitorService';

const STATUS_PAYLOAD = {
  ok: true,
  session: 'main',
  connected: true,
  enabled: false,
  parentGroupId: null,
  childGroupIds: [],
  lastMessageAt: null,
  lastMessageId: null,
  lastSendAt: null,
  lastSendMessageId: null,
  lastError: null,
};

function mockFetch(payload: unknown = STATUS_PAYLOAD) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function requestBody(fn: ReturnType<typeof mockFetch>): Record<string, unknown> {
  const init = fn.mock.calls[0]?.[1] as RequestInit;
  return JSON.parse(String(init.body));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('updateMonitorServerConfig', () => {
  it('envia enabled:true no POST /api/monitor junto da configuração', async () => {
    const fetchFn = mockFetch();
    await updateMonitorServerConfig({
      sessionId: 'main',
      parentGroupId: '111@g.us',
      childGroupIds: ['222@g.us'],
      childGroupDelays: { '222@g.us': 30 },
      enabled: true,
    });

    const url = String(fetchFn.mock.calls[0]?.[0]);
    expect(url).toMatch(/\/api\/monitor$/);
    expect((fetchFn.mock.calls[0]?.[1] as RequestInit).method).toBe('POST');
    expect(requestBody(fetchFn)).toEqual({
      sessionId: 'main',
      parentGroupId: '111@g.us',
      childGroupIds: ['222@g.us'],
      childGroupDelays: { '222@g.us': 30 },
      enabled: true,
    });
  });

  it('envia enabled:false ao pausar', async () => {
    const fetchFn = mockFetch();
    await updateMonitorServerConfig({
      sessionId: 'main',
      parentGroupId: '111@g.us',
      childGroupIds: ['222@g.us'],
      enabled: false,
    });
    expect(requestBody(fetchFn).enabled).toBe(false);
  });

  it('omite enabled quando não informado (mantém comportamento legado)', async () => {
    const fetchFn = mockFetch();
    await updateMonitorServerConfig({
      parentGroupId: null,
      childGroupIds: [],
    });
    expect(requestBody(fetchFn)).not.toHaveProperty('enabled');
  });
});

describe('getMonitorStatus', () => {
  it('consulta /api/monitor/status com sessionId', async () => {
    const fetchFn = mockFetch();
    await getMonitorStatus('main');
    const url = String(fetchFn.mock.calls[0]?.[0]);
    expect(url).toContain('/api/monitor/status');
    expect(url).toContain('sessionId=main');
  });
});
