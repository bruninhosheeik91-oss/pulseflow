import { MonitorServerStatus } from '../../services/whatsApp/monitorService';

export interface MonitorUiState {
  /** enabled real retornado por GET /api/monitor/status (null = indisponível). */
  backendEnabled: boolean | null;
  isPaused: boolean;
  active: boolean;
}

/**
 * Deriva o estado visual do monitor a partir da resposta REAL do backend
 * (GET /api/monitor/status). Com backend acessível ele é a única fonte de
 * verdade — o estado local nunca o sobrescreve (ex.: após reload, o monitor
 * continua pausado se o servidor disser enabled:false). Sem backend, usa o
 * fallback local.
 */
export function resolveMonitorUiState(
  status: MonitorServerStatus | null,
  reachable: boolean | null,
  fallbackPaused: boolean
): MonitorUiState {
  if (reachable === true) {
    const enabled = Boolean(status?.enabled);
    return { backendEnabled: enabled, isPaused: !enabled, active: enabled };
  }
  return { backendEnabled: null, isPaused: fallbackPaused, active: false };
}
