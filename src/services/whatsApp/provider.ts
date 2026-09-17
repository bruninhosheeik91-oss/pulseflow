import {
  WhatsAppAccount,
  WhatsAppConnectionStatus,
  WhatsAppGroup,
} from '../../types/whatsApp';

export interface WhatsAppQrPayload {
  imageDataUrl: string;
  expiresAt: number;
}

/**
 * Resultado detalhado da sincronização de grupos do backend.
 * warmingUp: sessão recém-conectada (MAIN) ainda em warm-up — NÃO é erro.
 * syncInProgress: já existe uma operação WPP real pendente — NÃO iniciar outra.
 */
export interface GroupsSyncResult {
  groups: WhatsAppGroup[];
  warmingUp: boolean;
  syncInProgress: boolean;
  cached: boolean;
  retryAfterMs: number;
  /** ISO da sincronização REAL deste snapshot (null quando desconhecido). */
  syncedAt: string | null;
}

/**
 * Snapshot de grupos já conhecido pelo servidor (memória ou arquivo persistido),
 * lido SEM tocar no WPPConnect. Fonte da Dashboard ao abrir.
 */
export interface CachedGroupsSnapshot {
  sessionId: string;
  groups: WhatsAppGroup[];
  syncedAt: string | null;
}

/**
 * Camada de serviço desacoplada para conexão WhatsApp.
 *
 * A implementação concreta será fornecida após a escolha do provedor
 * (Baileys, WPPConnect, Evolution API, WhatsApp Cloud API, etc.).
 * Nenhuma resposta falsa é produzida por aqui.
 */
export interface WhatsAppProvider {
  readonly id: string;
  readonly label: string;
  connect(sessionId?: string): Promise<void>;
  disconnect(sessionId?: string): Promise<void>;
  /** Recupera sessão travada no QR: encerra a sessão órfã e gera um QR novo real. */
  recoverQr(sessionId?: string): Promise<void>;
  getConnectionStatus(sessionId?: string): Promise<WhatsAppConnectionStatus>;
  getQrCode(sessionId?: string): Promise<WhatsAppQrPayload | null>;
  getAccount(sessionId?: string): Promise<WhatsAppAccount | null>;
  getGroups(sessionId?: string): Promise<WhatsAppGroup[]>;
  /** Grupos de uma conta específica, já etiquetados com a sessão de origem. */
  getGroupsForSession(sessionId: string): Promise<WhatsAppGroup[]>;
  /**
   * Sincronização detalhada: distingue warm-up pós-login de sincronização em
   * andamento de falha real. Opcional para provedores legados.
   */
  getGroupsSyncResult?(sessionId?: string): Promise<GroupsSyncResult>;
  /**
   * Grupos já em cache no servidor para todas as contas, sem chamada WPP.
   * Usado para hidratar a Dashboard ao abrir. Opcional para provedores legados.
   */
  getCachedGroups?(): Promise<CachedGroupsSnapshot[]>;
  /** Envia por uma sessão específica quando informada; sem sessionId usa a principal. */
  sendMessage(to: string, text: string, sessionId?: string): Promise<void>;
  listAccounts(): Promise<WhatsAppAccount[]>;
  /** Cria uma conta com o nome visual informado (sessionId gerado no backend). */
  createAccount(displayName: string): Promise<WhatsAppAccount>;
  /** Renomeia apenas o displayName; nunca altera sessionId/tokens/sessão. */
  renameAccount(sessionId: string, displayName: string): Promise<WhatsAppAccount>;
  /** Remove permanentemente uma sessão (conta + estado + tokens). */
  removeAccount(sessionId: string): Promise<void>;
}

export class WhatsAppProviderNotConfiguredError extends Error {
  constructor() {
    super('Provedor de conexão ainda não configurado.');
    this.name = 'WhatsAppProviderNotConfiguredError';
  }
}

let currentProvider: WhatsAppProvider | null = null;

/**
 * Registra o provedor de conexão usado pela aplicação.
 * Enquanto nenhum provedor for registrado, a central de conexão
 * permanece no estado "provedor não configurado".
 */
export function configureWhatsAppProvider(
  provider: WhatsAppProvider | null
): void {
  currentProvider = provider;
}

export function getWhatsAppProvider(): WhatsAppProvider | null {
  return currentProvider;
}
