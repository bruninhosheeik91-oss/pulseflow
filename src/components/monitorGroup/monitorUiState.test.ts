import { describe, expect, it } from 'vitest';
import { MonitorServerStatus } from '../../services/whatsApp/monitorService';
import { resolveMonitorUiState } from './monitorUiState';

function status(enabled: boolean): MonitorServerStatus {
  return {
    ok: true,
    session: 'main',
    connected: true,
    enabled,
    parentGroupId: '111@g.us',
    childGroupIds: ['222@g.us'],
    lastMessageAt: null,
    lastMessageId: null,
    lastSendAt: null,
    lastSendMessageId: null,
    lastError: null,
  };
}

describe('resolveMonitorUiState', () => {
  it('exibe Ativo somente quando o backend retorna enabled:true', () => {
    const active = resolveMonitorUiState(status(true), true, false);
    expect(active.active).toBe(true);
    expect(active.isPaused).toBe(false);

    const inactive = resolveMonitorUiState(status(false), true, false);
    expect(inactive.active).toBe(false);
    expect(inactive.isPaused).toBe(true);
  });

  it('ao abrir a tela, reflete o estado real do servidor (reload)', () => {
    // Estado local dizia "configurada", mas o servidor está pausado.
    const ui = resolveMonitorUiState(status(false), true, false);
    expect(ui.isPaused).toBe(true);
    expect(ui.active).toBe(false);
    expect(ui.backendEnabled).toBe(false);
  });

  it('sem backend acessível usa o fallback local e nunca mostra Ativo', () => {
    expect(resolveMonitorUiState(status(true), false, true).isPaused).toBe(true);
    expect(resolveMonitorUiState(status(true), false, false).active).toBe(false);
    expect(resolveMonitorUiState(null, null, true).active).toBe(false);
  });
});
