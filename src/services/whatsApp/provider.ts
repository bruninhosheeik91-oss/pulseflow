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
