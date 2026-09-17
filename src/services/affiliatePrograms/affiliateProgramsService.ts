const DEFAULT_BASE_URL = 'http://localhost:3001';

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WPP_BACKEND_URL as string | undefined;
  return (fromEnv && fromEnv.trim()) || DEFAULT_BASE_URL;
}

// Resolução do tenant no frontend.
//
// NÃO existe ainda uma fonte confiável de tenant (auth/sessão por cliente) no
// frontend. Todas as rotas do backend exigem X-Tenant-Id exatamente para
// garantir o isolamento entre clientes (SaaS single-plan). Por regra do fluxo
// não se inventa nem se hardcoda tenant de produção.
//
// Em desenvolvimento, VITE_DEV_TENANT_ID habilita o teste REAL local das
// credenciais Shopee sem criar autenticação. Em produção, NUNCA há fallback
// de desenvolvimento.
export function getCurrentTenantId(): string | null {
  // 1. Futuro: priorizar o tenant da sessão/autenticação quando existir. Ex.:
  //    const fromSession = sessionStore.getTenantId();
  //    if (fromSession) return fromSession;

  // 2. Fallback SOMENTE de desenvolvimento (import.meta.env.DEV), nunca em
  //    produção. Apenas um valor não vazio e com formato válido é aceito.
  if (import.meta.env.DEV) {
    const devTenant = String(import.meta.env.VITE_DEV_TENANT_ID || '').trim();
    if (TENANT_ID_PATTERN.test(devTenant)) return devTenant;
  }

  // 3. Produção (ou dev sem VITE_DEV_TENANT_ID): nenhum fallback. A integração
  //    permanece desligada até existir auth/sessão por cliente.
  return null;
}

// Mesmo padrão do backend (SESSION_ID_PATTERN). Impede que um valor
// malformado do .env local chegue ao servidor.
const TENANT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

interface ApiResponse<T> {
  ok?: boolean;
  error?: string;
  data?: T;
}

export class AffiliateProgramsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AffiliateProgramsApiError';
  }
}

export function sanitizeAffiliateError(err: unknown): string {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as Error).message)
      : 'Erro inesperado.';
  return msg.slice(0, 300);
}

async function apiFetch<T>(
  path: string,
  tenantId: string,
  init?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...(init?.headers || {}),
  };
  const res = await fetch(`${getBaseUrl()}${path}`, { ...init, headers });
  const body = (await res.json().catch(() => null)) as
    | (ApiResponse<T> & Partial<T>)
    | null;
  if (!res.ok) {
    throw new AffiliateProgramsApiError(
      (body && body.error) || `Erro ${res.status} ao comunicar com o servidor.`
    );
  }
  return (body as unknown) as T;
}

export interface ShopeeCredentialsView {
  configured: boolean;
  enabled: boolean;
  appIdMasked: string | null;
  subIds: string[];
  status: string;
  lastTestedAt: string | null;
  lastError: string | null;
  updatedAt: string | null;
}

export interface ShopeeCredentialsPayload {
  appId?: string;
  secret?: string;
  enabled?: boolean;
  subIds?: string[];
}

export interface ShopeeTestResult {
  status: 'idle' | 'connected' | 'error';
  error?: string;
  affiliateUrl?: string | null;
}

export async function getShopeeCredentials(
  tenantId: string
): Promise<ShopeeCredentialsView> {
  const res = await apiFetch<{ credentials: ShopeeCredentialsView }>(
    '/api/affiliate/credentials/shopee',
    tenantId,
    { method: 'GET' }
  );
  return res.credentials;
}

export async function saveShopeeCredentials(
  tenantId: string,
  payload: ShopeeCredentialsPayload
): Promise<ShopeeCredentialsView> {
  const res = await apiFetch<{ credentials: ShopeeCredentialsView }>(
    '/api/affiliate/credentials/shopee',
    tenantId,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return res.credentials;
}

export async function testShopeeConnection(
  tenantId: string
): Promise<ShopeeTestResult> {
  const res = await apiFetch<ShopeeTestResult>(
    '/api/affiliate/credentials/shopee/test',
    tenantId,
    { method: 'POST', body: JSON.stringify({}) }
  );
  return res;
}

// ===== Busca Automática (fonte real Shopee, tenant-scoped) =====

export type AutoSearchPriority =
  | 'desconto'
  | 'comissao'
  | 'vendas'
  | 'avaliacao'
  | 'variedade';

export interface AutoSearchFilters {
  minPrice: number | null;
  maxPrice: number | null;
  minDiscount: number | null;
  minCommission: number | null;
  minSales: number | null;
  minRating: number | null;
}

export interface AutoSearchScheduleConfig {
  startDate: string;
  endDate: string;
  timeStart: string;
  timeEnd: string;
  intervalMinutes: number;
}

export interface AutoSearchDestinationConfig {
  accountId: string;
  groupIds: string[];
}

export interface AutoSearchAutomation {
  id: string;
  name: string;
  marketplace: 'Shopee';
  active: boolean;
  destination: AutoSearchDestinationConfig;
  schedule: AutoSearchScheduleConfig;
  categories: { general: boolean; categoryId: number | null };
  filters: AutoSearchFilters;
  maxResults: number;
  priority: AutoSearchPriority;
  messageTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export type AutoSearchAutomationPayload = Partial<
  Omit<AutoSearchAutomation, 'createdAt' | 'updatedAt' | 'marketplace'>
> & { name?: string };

export interface AutoSearchGroup {
  id: string;
  name: string | null;
  memberCount: number | null;
  isGroup?: boolean;
}

export interface AutoSearchAccountDestination {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  groups: AutoSearchGroup[];
}

export interface AutoSearchRunProduct {
  itemId: number | null;
  shopId: number | null;
  productName: string;
  shopName: string;
  imageUrl: string;
  price: number | null;
  originalPrice: number | null;
  priceMin: number | null;
  priceMax: number | null;
  discountPercentage: number;
  commissionAmount: number | null;
  commissionRate: number | null;
  sales: number;
  rating: number | null;
  categoryIds: number[];
  productLink: string;
  offerLink: string;
  affiliateUrl: string | null;
  linkError?: string | null;
  status: 'qualified' | 'ignored';
  rejectReason?: string;
}

export interface AutoSearchRunResult {
  ok: boolean;
  tenant?: string;
  marketplacesConsulted?: number;
  consulted?: number;
  qualified: number;
  ignored: number;
  shortLinksGenerated?: number;
  filtersApplied?: Record<string, unknown>;
  products?: AutoSearchRunProduct[];
  error?: string;
}

export interface AutoSearchConfigView {
  configured: boolean;
  enabled: boolean;
  status: string;
  appIdMasked: string | null;
  subIds: string[];
}

export interface AutoSearchRunPayload {
  maxResults?: number;
  priority?: AutoSearchPriority;
  categoryId?: number | null;
  keyword?: string;
  filters?: Partial<AutoSearchFilters>;
}

export async function getAutoSearchConfig(
  tenantId: string
): Promise<AutoSearchConfigView> {
  const res = await apiFetch<{ config: AutoSearchConfigView }>(
    '/api/affiliate/auto-search/config',
    tenantId,
    { method: 'GET' }
  );
  return res.config;
}

export async function listAutoSearchAutomations(
  tenantId: string
): Promise<AutoSearchAutomation[]> {
  const res = await apiFetch<{ automations: AutoSearchAutomation[] }>(
    '/api/affiliate/auto-search/automations',
    tenantId,
    { method: 'GET' }
  );
  return res.automations || [];
}

export async function createAutoSearchAutomation(
  tenantId: string,
  payload: AutoSearchAutomationPayload
): Promise<AutoSearchAutomation> {
  const res = await apiFetch<{ automation: AutoSearchAutomation }>(
    '/api/affiliate/auto-search/automations',
    tenantId,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return res.automation;
}

export async function updateAutoSearchAutomation(
  tenantId: string,
  id: string,
  payload: AutoSearchAutomationPayload
): Promise<AutoSearchAutomation> {
  const res = await apiFetch<{ automation: AutoSearchAutomation }>(
    `/api/affiliate/auto-search/automations/${encodeURIComponent(id)}`,
    tenantId,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return res.automation;
}

export async function deleteAutoSearchAutomation(
  tenantId: string,
  id: string
): Promise<void> {
  await apiFetch(
    `/api/affiliate/auto-search/automations/${encodeURIComponent(id)}`,
    tenantId,
    { method: 'DELETE' }
  );
}

export async function getAutoSearchDestinations(
  tenantId: string
): Promise<AutoSearchAccountDestination[]> {
  const res = await apiFetch<{ accounts: AutoSearchAccountDestination[] }>(
    '/api/affiliate/auto-search/destinations',
    tenantId,
    { method: 'GET' }
  );
  return res.accounts || [];
}

export async function runAutoSearch(
  tenantId: string,
  payload: AutoSearchRunPayload
): Promise<AutoSearchRunResult> {
  const res = await apiFetch<AutoSearchRunResult>(
    '/api/affiliate/auto-search/run',
    tenantId,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return res;
}

// ===== Envio manual real (1 produto, 1 grupo, 1 conta salvos na automação) =====

export interface AutoSearchSendRequestBody {
  itemId: number;
  groupId: string;
}

export interface AutoSearchSendRecord {
  tenantId: string;
  automationId: string;
  sessionId: string;
  groupId: string;
  itemId: number | null;
  marketplace: 'Shopee';
  affiliateUrl: string;
  productName: string;
  sentAt: string;
  status: 'sent' | 'failed';
  messageId: string | null;
  error: string | null;
}

export interface AutoSearchSendResult {
  ok: boolean;
  tenant?: string;
  error?: string;
  message?: string;
  send: AutoSearchSendRecord;
}

export async function sendAutoSearchTest(
  tenantId: string,
  automationId: string,
  body: AutoSearchSendRequestBody
): Promise<AutoSearchSendResult> {
  const res = await apiFetch<AutoSearchSendResult>(
    `/api/affiliate/auto-search/automations/${encodeURIComponent(automationId)}/send`,
    tenantId,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return res;
}

export async function listAutoSearchSends(
  tenantId: string
): Promise<AutoSearchSendRecord[]> {
  const res = await apiFetch<{ sends: AutoSearchSendRecord[] }>(
    '/api/affiliate/auto-search/sends',
    tenantId,
    { method: 'GET' }
  );
  return res.sends || [];
}