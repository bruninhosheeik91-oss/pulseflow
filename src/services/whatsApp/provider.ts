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
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionStatus(): Promise<WhatsAppConnectionStatus>;
  getQrCode(): Promise<WhatsAppQrPayload | null>;
  getAccount(): Promise<WhatsAppAccount | null>;
  getGroups(): Promise<WhatsAppGroup[]>;
  sendMessage(to: string, text: string): Promise<void>;
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