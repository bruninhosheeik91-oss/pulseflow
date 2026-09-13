'use strict';
// ===== Client da Affiliate Open API da Shopee (Brasil) =====
//
// Contrato oficial (verificado em documentação/SDKs de referência da
// Affiliate Open API — open-api.affiliate.shopee.com.br/graphql):
//   - assinatura : SHA256(AppId + Timestamp + PayloadJSON + Secret), hex lowercase
//   - header     : "SHA256 Credential=<AppId>, Timestamp=<UnixSeconds>, Signature=<sig>"
//   - payload    : o corpo JSON EXATO enviado no POST (a assinatura cobre esse string)
//   - GraphQL    : mutation generateShortLink(input: { originUrl, subIds[] }) -> shortLink
//   - GraphQL    : query productOfferV2(input: { ... }) -> nodes { ... }
//   - endpoint   : configurável (padrão Brasil), nunca usa o painel privado
//
// Garantias de segurança:
//   - credenciais vêm do backend (credenciais explícitas por tenant OU
//     process.env no fluxo legado): SHOPEE_AFFILIATE_APP_ID,
//     SHOPEE_AFFILIATE_SECRET, SHOPEE_AFFILIATE_API_URL
//   - NUNCA loga o Secret (nem o fator/string assinado que o contém)
//   - timeout de request com abort
//   - qualquer falha vira exceção para o adapter (monitor nunca quebra)

const { createHash } = require('node:crypto');

const DEFAULT_API_URL = 'https://open-api.affiliate.shopee.com.br/graphql';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_SUB_IDS = 5;
const RESOLVED_URL_TTL_MS = 5 * 60 * 1000;
const RESOLVED_URL_CACHE_LIMIT = 200;

// O Grupo Monitor recebe com frequência shortlinks s.shopee.com.br. O fluxo
// legado do monitor extrai itemId/shopId via `new URL(sourceUrl)`, então mantém
// um cache curto da URL canônica após seguir o redirect oficial. Um wrapper
// transparente de URL substitui SOMENTE shortlinks já resolvidos; todo o resto
// continua usando a implementação nativa sem alteração.
const NativeURL = global.URL;
const resolvedSourceUrls = new Map();
const URL_PATCH_MARK = Symbol.for('pulseflow.shopeeResolvedUrlPatch');

function isShopeeShortUrl(value) {
  try {
    const parsed = new NativeURL(value);
    const host = parsed.hostname.toLowerCase();
    return (
      host.startsWith('s.shopee.') ||
      host === 'shp.ee' ||
      host.endsWith('.shp.ee')
    );
  } catch {
    return false;
  }
}

function isShopeeCanonicalUrl(value) {
  try {
    const parsed = new NativeURL(value);
    const host = parsed.hostname.toLowerCase();
    return host === 'shopee.com.br' || host.endsWith('.shopee.com.br');
  } catch {
    return false;
  }
}

function pruneResolvedSourceUrls(now = Date.now()) {
  for (const [key, entry] of resolvedSourceUrls.entries()) {
    if (!entry || entry.expiresAt <= now) resolvedSourceUrls.delete(key);
  }
  while (resolvedSourceUrls.size > RESOLVED_URL_CACHE_LIMIT) {
    const oldest = resolvedSourceUrls.keys().next().value;
    resolvedSourceUrls.delete(oldest);
  }
}

function rememberResolvedSourceUrl(sourceUrl, resolvedUrl) {
  if (!isShopeeShortUrl(sourceUrl) || !isShopeeCanonicalUrl(resolvedUrl)) return;
  if (sourceUrl === resolvedUrl) return;
  pruneResolvedSourceUrls();
  resolvedSourceUrls.set(sourceUrl, {
    url: resolvedUrl,
    expiresAt: Date.now() + RESOLVED_URL_TTL_MS,
  });
}

function lookupResolvedSourceUrl(sourceUrl) {
  pruneResolvedSourceUrls();
  const entry = resolvedSourceUrls.get(sourceUrl);
  return entry && entry.url ? entry.url : null;
}

if (!global.URL[URL_PATCH_MARK]) {
  class PulseFlowResolvedURL extends NativeURL {
    constructor(input, base) {
      const mapped =
        typeof input === 'string' ? lookupResolvedSourceUrl(input) : null;
      super(mapped || input, base);
    }
  }
  Object.defineProperty(PulseFlowResolvedURL, URL_PATCH_MARK, {
    value: true,
    enumerable: false,
  });
  global.URL = PulseFlowResolvedURL;
}

class ShopeeAffiliateApiError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ShopeeAffiliateApiError';
    this.kind = fields.kind || 'api';
    this.httpStatus = fields.httpStatus || null;
    this.providerMessage = fields.providerMessage || null;
  }
}

class ShopeeAffiliateCredentialError extends ShopeeAffiliateApiError {
  constructor(message, fields = {}) {
    super(message, { ...fields, kind: 'credentials' });
    this.name = 'ShopeeAffiliateCredentialError';
  }
}

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

// Assinatura oficial: SHA256(AppId + Timestamp + Payload + Secret)
function sign(appId, timestamp, payload, secret) {
  return sha256Hex(`${appId}${timestamp}${payload}${secret}`);
}

function buildAuthorizationHeader(appId, timestamp, signature) {
  return `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;
}

// SubId 1..5: trim, remove vazios, limita a 5.
function sanitizeSubIds(subIds) {
  if (!Array.isArray(subIds)) return [];
  return subIds
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, MAX_SUB_IDS);
}

// Query GraphQL da operação generateShortLink (mesma forma dos SDKs oficiais).
function buildGenerateShortLinkQuery(sourceUrl, subIds) {
  const clean = sanitizeSubIds(subIds);
  const subIdsPart =
    clean.length > 0
      ? `, subIds: [${clean.map((s) => JSON.stringify(s)).join(', ')}]`
      : '';
  return `mutation { generateShortLink(input: { originUrl: ${JSON.stringify(
    sourceUrl
  )}${subIdsPart} }) { shortLink } }`;
}

// Query GraphQL da operação productOfferV2. Contrato real (introspecção):
// argumentos top-level (sem wrapper input), pageSize usa o nome `limit`,
// sem offerStatus; productCatId é filtro real de categoria (Int). Campos
// solicitados são os disponíveis na operação (incl. productCatIds reais).
function buildProductOfferV2Query({ keyword, page, limit, sortType, productCatId }) {
  const parts = [
    `page: ${JSON.stringify(page)}`,
    `limit: ${JSON.stringify(limit)}`,
  ];
  if (keyword !== undefined) parts.push(`keyword: ${JSON.stringify(keyword)}`);
  if (sortType !== undefined) parts.push(`sortType: ${JSON.stringify(sortType)}`);
  if (productCatId !== undefined && productCatId !== null) {
    parts.push(`productCatId: ${JSON.stringify(productCatId)}`);
  }
  return `query { productOfferV2(${parts.join(', ')}) { nodes {
    itemId
    shopId
    productName
    shopName
    imageUrl
    price
    priceMin
    priceMax
    priceDiscountRate
    commission
    commissionRate
    sales
    ratingStar
    productCatIds
    productLink
    offerLink
    periodStartTime
    periodEndTime
  } } }`;
}

// Reduz texto de resposta mantendo apenas campos seguros (sem credenciais).
function safeProviderMessage(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.errors && Array.isArray(parsed.errors)) {
      const msg = parsed.errors[0]?.message;
      return typeof msg === 'string' && msg.length > 0 ? String(msg).slice(0, 500) : null;
    }
    if (parsed && parsed.message) return String(parsed.message).slice(0, 500);
  } catch {
    // corpo não-JSON: não espelhar texto cru (pode conter dados sensíveis)
  }
  return null;
}

// Normaliza credenciais explícitas (multi-cliente). Quando fornecidas, têm
// prioridade sobre process.env. Segredos chegam já resolvidos pelo tenant.
function normalizeExplicitCredentials(credentials) {
  if (!credentials || typeof credentials !== 'object') return null;
  const appId = String(credentials.appId || '').trim();
  const secret = String(credentials.secret || credentials.secretKey || '').trim();
  if (!appId || !secret) return null;
  const apiUrl =
    String(credentials.apiUrl || '').trim() || DEFAULT_API_URL;
  return { appId, secret, apiUrl };
}

// Cria o client. `env`/`fetchImpl`/`timeoutMs` são injetáveis para teste;
// em produção usa credenciais explícitas (tenant autenticado) ou ambiente.
function createShopeeApiClient(options = {}) {
  const env = options.env || process.env;
  const explicitCredentials = normalizeExplicitCredentials(options.credentials);
  const fetchImpl =
    typeof options.fetchImpl === 'function' ? options.fetchImpl : fetch;
  const timeoutMs =
    typeof options.timeoutMs === 'number' && options.timeoutMs > 0
      ? options.timeoutMs
      : DEFAULT_TIMEOUT_MS;

  function readCredentials() {
    if (explicitCredentials) return explicitCredentials;
    const appId = String(env.SHOPEE_AFFILIATE_APP_ID || '').trim();
    const secret = String(env.SHOPEE_AFFILIATE_SECRET || '').trim();
    const apiUrl = String(env.SHOPEE_AFFILIATE_API_URL || '').trim() || DEFAULT_API_URL;
    return { appId, secret, apiUrl };
  }

  // Internal: assina, envia e parseia UMA query GraphQL. Devolve o corpo JSON
  // já validado (sem errors). Lança exceções sanitizadas nos demais casos.
  // NUNCA loga o Secret, a assinatura ou o header Authorization.
  async function executeGraphQL(queryString) {
    const { appId, secret, apiUrl } = readCredentials();
    if (!appId || !secret) {
      throw new ShopeeAffiliateCredentialError(
        'Credenciais da Affiliate Open API ausentes (AppId/Secret).'
      );
    }

    const body = JSON.stringify({ query: queryString });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(appId, timestamp, body, secret);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: buildAuthorizationHeader(appId, timestamp, signature),
        },
        body,
        signal: controller.signal,
      });
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new ShopeeAffiliateApiError(
          `Timeout após ${timeoutMs}ms ao chamar a Affiliate Open API.`,
          { kind: 'timeout' }
        );
      }
      throw new ShopeeAffiliateApiError(
        `Falha de rede ao chamar a Affiliate Open API: ${
          err && err.message ? err.message : 'erro desconhecido'
        }`,
        { kind: 'network' }
      );
    } finally {
      clearTimeout(timer);
    }

    const rawText = await response.text();
    if (!response.ok) {
      const providerMessage = safeProviderMessage(rawText);
      if (response.status === 401 || response.status === 403) {
        throw new ShopeeAffiliateCredentialError(
          `Credenciais rejeitadas pela Affiliate Open API (HTTP ${response.status}).`,
          { httpStatus: response.status, providerMessage }
        );
      }
      throw new ShopeeAffiliateApiError(
        `Affiliate Open API respondeu HTTP ${response.status}.`,
        { httpStatus: response.status, providerMessage }
      );
    }

    let json;
    try {
      json = JSON.parse(rawText || '{}');
    } catch {
      throw new ShopeeAffiliateApiError(
        `Resposta inválida (não-JSON, HTTP 200) da Affiliate Open API.`,
        { kind: 'invalid_response' }
      );
    }

    if (json.errors && Array.isArray(json.errors) && json.errors.length > 0) {
      const first = json.errors[0] || {};
      throw new ShopeeAffiliateApiError(
        `Erro GraphQL da Affiliate Open API: ${
          first.message ? String(first.message).slice(0, 500) : 'sem mensagem'
        }`,
        { kind: 'graphql', providerMessage: safeProviderMessage(rawText) }
      );
    }

    return json;
  }

  // Segue apenas o redirect HTTP do shortlink oficial para que o monitor,
  // logo depois da conversão afiliada, consiga extrair slug/itemId da URL
  // canônica. Falha de redirect nunca invalida o link afiliado já gerado.
  async function rememberShortLinkTarget(sourceUrl) {
    if (!isShopeeShortUrl(sourceUrl)) return;
    const controller = new AbortController();
    const redirectTimeoutMs = Math.min(timeoutMs, 10000);
    const timer = setTimeout(() => controller.abort(), redirectTimeoutMs);
    try {
      const response = await fetchImpl(sourceUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
        },
      });
      const resolvedUrl =
        response && typeof response.url === 'string' ? response.url.trim() : '';
      if (resolvedUrl) rememberResolvedSourceUrl(sourceUrl, resolvedUrl);
      if (response && response.body && typeof response.body.cancel === 'function') {
        try {
          await response.body.cancel();
        } catch {
          // O corpo não é usado; somente a URL final do redirect importa.
        }
      }
    } catch {
      // Best-effort: a conversão afiliada continua mesmo sem resolver o produto.
    } finally {
      clearTimeout(timer);
    }
  }

  // Gera o short link afiliado a partir de uma URL real do Shopee.
  // Devolve { affiliateUrl }. Lança para o adapter em falhas.
  async function generateShortLink({ sourceUrl, subIds } = {}) {
    if (typeof sourceUrl !== 'string' || !sourceUrl.trim()) {
      throw new ShopeeAffiliateApiError('sourceUrl é obrigatório.');
    }
    const cleanSourceUrl = sourceUrl.trim();
    const query = buildGenerateShortLinkQuery(
      cleanSourceUrl,
      sanitizeSubIds(subIds)
    );
    const json = await executeGraphQL(query);

    const shortLink =
      json.data &&
      json.data.generateShortLink &&
      json.data.generateShortLink.shortLink;
    if (typeof shortLink !== 'string' || !shortLink.trim()) {
      throw new ShopeeAffiliateApiError(
        'Resposta sem affiliateUrl (campo shortLink ausente na resposta).',
        { kind: 'invalid_response' }
      );
    }

    await rememberShortLinkTarget(cleanSourceUrl);
    return {
      affiliateUrl: shortLink.trim(),
      resolvedSourceUrl: lookupResolvedSourceUrl(cleanSourceUrl) || null,
    };
  }

  // Consulta produtos/ofertas reais (sem mock). Devolve { nodes } — lista de
  // produtos da Affiliate Open API, cada nó contendo os campos que a Shopee
  // disponibilizar (itemId, shopId, productName, imageUrl, price, priceMin,
  // priceMax, priceDiscountRate, commission, commissionRate, sales, ratingStar,
  // productLink, offerLink, periodStartTime, periodEndTime).
  async function productOfferV2({
    keyword,
    page = 1,
    limit = 5,
    sortType,
    productCatId,
  } = {}) {
    const input = {
      page: Math.max(Number(page) || 1, 1),
      limit: Math.min(Math.max(Number(limit) || 5, 1), 5),
    };
    if (typeof keyword === 'string' && keyword.trim()) {
      input.keyword = keyword.trim();
    }
    if (typeof sortType === 'number') input.sortType = sortType;
    if (productCatId !== undefined && productCatId !== null) {
      const cat = Number(productCatId);
      if (Number.isInteger(cat) && cat >= 0) input.productCatId = cat;
    }

    const query = buildProductOfferV2Query(input);
    const json = await executeGraphQL(query);

    const nodes =
      json.data && json.data.productOfferV2 && json.data.productOfferV2.nodes;
    if (!Array.isArray(nodes)) {
      throw new ShopeeAffiliateApiError(
        'Resposta sem nodes em productOfferV2.',
        { kind: 'invalid_response' }
      );
    }
    return { nodes };
  }

  return {
    generateShortLink,
    productOfferV2,
    // expostos como utilitários internos (testes)
    _internals: {
      sign,
      buildGenerateShortLinkQuery,
      buildProductOfferV2Query,
      sanitizeSubIds,
      buildAuthorizationHeader,
      isShopeeShortUrl,
      rememberResolvedSourceUrl,
      lookupResolvedSourceUrl,
    },
  };
}

module.exports = {
  createShopeeApiClient,
  ShopeeAffiliateApiError,
  ShopeeAffiliateCredentialError,
  DEFAULT_API_URL,
};