'use strict';
// ===== Credenciais de Afiliados por Cliente (tenant) =====
//
// Multi-cliente (SaaS single-plan): CADA cliente usa as PRÓPRIAS credenciais
// dos programas de afiliados. Persistência por tenant:
//   server/data/tenants.json                  -> registro de tenants (registry)
//   server/data/credentials/<tenantId>.json   -> credenciais do tenant
//
// Garantias de segurança:
//   - segredo cifrado em repouso (AES-256-GCM) com ENCRYPTION_KEY do servidor
//   - segredo NUNCA volta ao frontend (publicView substitui por hasSecret)
//   - segredo NUNCA em logs
//   - NÃO usar .env para credenciais de clientes (apenas ENCRYPTION_KEY)
//   - sem ENCRYPTION_KEY configurada, salvar segredo é RECUSADO (nunca
//     persiste texto-plano)
//
// Formato persistido por tenant:
//   {
//     updatedAt: "ISO",
//     shopee: {
//       appId: "123",
//       secret: "ENC:aes256gcm:<iv>:<tag>:<cipher>",
//       affiliateDomain: "s.shopee.com.br",
//       subIds: ["canal-x"],
//       enabled: true,
//       status: "idle|connected|error",
//       lastTestedAt: null,
//       lastError: null
//     },
//     amazon: { ... }, aliExpress: { ... }, mercadoLivre: { ... },
//     magalu: { ... }, tiktokShop: { ... },
//     globalUtmSource: "", globalUtmMedium: "", globalUtmCampaign: ""
//   }

const crypto = require('node:crypto');
const path = require('node:path');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');

const TENANTS_FILE_NAME = 'tenants.json';
const CREDENTIALS_DIR_NAME = 'credentials';

// Campos de segredo por marketplace. Únicos valores que NUNCA são devolvidos
// ao frontend e são cifrados em repouso.
const SECRET_FIELDS = {
  shopee: ['secret'],
  amazon: ['secretAccessKey'],
  aliExpress: ['secretKey'],
  mercadoLivre: ['clientSecret'],
  tiktokShop: ['appSecret'],
};

// Campos controlados apenas pelo backend (nunca aceitos via PUT).
const MANAGED_FIELDS = new Set([
  'status',
  'lastTestedAt',
  'lastError',
  'updatedAt',
]);

const ENC_PREFIX = 'ENC:aes256gcm:';
const MAX_SUB_IDS = 5;

class EncryptionKeyMissingError extends Error {
  constructor(message) {
    super(message || 'ENCRYPTION_KEY ausente; segredo não foi persistido.');
    this.name = 'EncryptionKeyMissingError';
  }
}

function parseKey(hexKey) {
  if (!hexKey) return null;
  try {
    const buf = Buffer.from(String(hexKey), 'hex');
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

function encryptSecret(plaintext, keyHex) {
  const key = parseKey(keyHex);
  if (!key) {
    throw new EncryptionKeyMissingError(
      'Segurado não persistido: ENCRYPTION_KEY (hex 32 bytes) não configurada no servidor.'
    );
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    ENC_PREFIX +
    [
      iv.toString('base64url'),
      tag.toString('base64url'),
      enc.toString('base64url'),
    ].join(':')
  );
}

function isEncryptedToken(value) {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

function decryptSecret(token, keyHex) {
  if (!isEncryptedToken(token)) return null;
  const key = parseKey(keyHex);
  if (!key) return null;
  const parts = token.split(':');
  const [, , ivB64, tagB64, dataB64] = parts;
  if (!ivB64 || !tagB64 || !dataB64) return null;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivB64, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}

function sanitizeError(err) {
  const msg = err && err.message ? String(err.message) : 'erro desconhecido';
  return msg.slice(0, 300);
}

function maskAppId(s) {
  if (!s) return null;
  const str = String(s);
  if (str.length <= 2) return str[0] + '•';
  if (str.length <= 4) return str.slice(0, 2) + '•'.repeat(str.length - 1);
  return str.slice(0, 3) + '•'.repeat(Math.max(str.length - 5, 2)) + str.slice(-2);
}

// Combina credenciais recebidas com as persistidas (merge defensivo).
// Regras:
//   - campo ausente (undefined)  -> mantém o valor atual
//   - segredo vazio/null         -> remove o segredo salvo
//   - segredo preenchido         -> cifra (exige ENCRYPTION_KEY)
//   - campos gerenciados         -> ignorados (só o backend altera)
function mergeMarketplaceIncoming(incoming, prev, secretNames, encryptionKey) {
  const result = { ...(prev || {}) };
  const source = incoming && typeof incoming === 'object' ? incoming : {};
  for (const key of Object.keys(source)) {
    if (MANAGED_FIELDS.has(key)) continue;
    const value = source[key];
    if (value === undefined) continue;
    if (secretNames.includes(key)) {
      if (value === null || value === '') {
        delete result[key];
      } else {
        result[key] = encryptSecret(String(value), encryptionKey);
      }
      continue;
    }
    if (typeof value === 'boolean') {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value
        .map((v) => String(v).trim())
        .filter(Boolean)
        .slice(0, MAX_SUB_IDS);
    } else if (typeof value === 'string') {
      result[key] = value.trim() || null;
    } else if (value !== null) {
      result[key] = value;
    }
  }
  return result;
}

function createAffiliateCredentialsStore(options = {}) {
  const dataDir = options.dataDir || path.join(__dirname, '..', 'data');
  const tenantsFile = path.join(dataDir, TENANTS_FILE_NAME);
  const credsDir = path.join(dataDir, CREDENTIALS_DIR_NAME);
  const encryptionKey = String(options.encryptionKey || process.env.ENCRYPTION_KEY || '');

  function ensureDirs() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    if (!existsSync(credsDir)) mkdirSync(credsDir, { recursive: true });
  }

  function loadTenants() {
    try {
      if (existsSync(tenantsFile)) {
        const parsed = JSON.parse(readFileSync(tenantsFile, 'utf8'));
        if (parsed && typeof parsed === 'object' && parsed.tenants) {
          return parsed.tenants;
        }
      }
    } catch {
      // registry corrompido -> recomeça vazio
    }
    return {};
  }

  function saveTenants(tenants) {
    ensureDirs();
    writeFileSync(
      tenantsFile,
      JSON.stringify({ tenants }, null, 2)
    );
  }

  function tenantExists(tenantId) {
    return Object.prototype.hasOwnProperty.call(loadTenants(), tenantId);
  }

  function listTenants() {
    const tenants = loadTenants();
    return Object.keys(tenants).map((id) => ({
      id,
      name: tenants[id] && tenants[id].name ? tenants[id].name : null,
      createdAt: tenants[id] && tenants[id].createdAt ? tenants[id].createdAt : null,
    }));
  }

  // Registro implícito no primeiro uso (bootstrap). Em produção deve ser
  // substituído pelo onboarding autenticado.
  function ensureTenant(tenantId) {
    const tenants = loadTenants();
    if (objectHas(tenants, tenantId)) return tenants[tenantId];
    const entry = { id: tenantId, name: null, createdAt: new Date().toISOString() };
    tenants[tenantId] = entry;
    saveTenants(tenants);
    return entry;
  }

  function credentialsPath(tenantId) {
    return path.join(credsDir, `${tenantId}.json`);
  }

  function readRaw(tenantId) {
    try {
      const file = credentialsPath(tenantId);
      if (!existsSync(file)) return null;
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeRaw(tenantId, data) {
    ensureDirs();
    writeFileSync(
      credentialsPath(tenantId),
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2)
    );
  }

  // Salva (merge) credenciais do tenant. Tenants desconhecidos são registrados
  // no primeiro save. Devolve a view pública (segredos ocultos).
  function putCredentials(tenantId, incoming) {
    ensureTenant(tenantId);
    const prev = readRaw(tenantId) || {};
    const payload = { ...incoming };

    // Compat de nomenclatura: campo de segredo Shopee é `secret`. Aceita o
    // antigo `secretKey` como entrada e normaliza para `secret`.
    if (payload.shopee && typeof payload.shopee === 'object') {
      const shopeeIn = payload.shopee;
      if (shopeeIn.secret === undefined && shopeeIn.secretKey !== undefined) {
        payload.shopee = { ...shopeeIn, secret: shopeeIn.secretKey };
        delete payload.shopee.secretKey;
      }
    }

    const next = { ...prev };
    for (const mkt of Object.keys(SECRET_FIELDS)) {
      const secretNames = SECRET_FIELDS[mkt];
      next[mkt] = mergeMarketplaceIncoming(
        payload[mkt],
        prev[mkt],
        secretNames,
        encryptionKey
      );
    }
    // Magalu não tem segredo; campos livres são normalizados de igual forma.
    if (payload.magalu !== undefined) {
      next.magalu = mergeMarketplaceIncoming(
        payload.magalu,
        prev.magalu,
        [],
        encryptionKey
      );
    }
    if (payload.globalUtmSource !== undefined) {
      next.globalUtmSource = String(payload.globalUtmSource).trim() || null;
    }
    if (payload.globalUtmMedium !== undefined) {
      next.globalUtmMedium = String(payload.globalUtmMedium).trim() || null;
    }
    if (payload.globalUtmCampaign !== undefined) {
      next.globalUtmCampaign = String(payload.globalUtmCampaign).trim() || null;
    }
    // Defaults controlados pelo backend.
    if (next.shopee) {
      if (!next.shopee.status) next.shopee.status = 'idle';
      if (next.shopee.enabled === undefined) next.shopee.enabled = false;
    }
    writeRaw(tenantId, next);
    return getPublicCredentials(tenantId);
  }

  // View para o frontend: NUNCA contém segredos. Segredo definido aparece como
  // hasSecret, e o campo em si é devolvido sempre nulo.
  function getPublicCredentials(tenantId) {
    const raw = readRaw(tenantId);
    if (!raw) return {};
    const view = { ...raw };
    for (const mkt of Object.keys(SECRET_FIELDS)) {
      if (!view[mkt] || typeof view[mkt] !== 'object') continue;
      const mktView = { ...view[mkt] };
      const hasSecret = SECRET_FIELDS[mkt].some((field) =>
        Boolean(mktView[field] || isEncryptedToken(mktView[field]))
      );
      for (const field of SECRET_FIELDS[mkt]) mktView[field] = null;
      mktView.hasSecret = hasSecret;
      view[mkt] = mktView;
    }
    return view;
  }

  // Credenciais Deco para chamadas reais (ex.: Affiliate Open API).
  // Devolve { appId, secret, apiUrl } ou null quando incompletas.
  function getShopeeApiCredentials(tenantId) {
    const raw = readRaw(tenantId);
    const shopee = raw && raw.shopee ? raw.shopee : {};
    const appId = typeof shopee.appId === 'string' ? shopee.appId.trim() : '';
    if (!appId || !shopee.secret) return null;
    const secret = decryptSecret(shopee.secret, encryptionKey);
    if (!secret) return null;
    return {
      appId,
      secret,
      apiUrl:
        (typeof shopee.apiUrl === 'string' && shopee.apiUrl.trim()) || null,
    };
  }

  // View segura e específica da Shopee para o GET: NUNCA contém segredo.
  // Campos: appIdMascarado, configured, enabled, subIds, status, updatedAt.
  function getShopeePublicView(tenantId) {
    const raw = readRaw(tenantId);
    if (!raw) {
      return {
        configured: false,
        enabled: false,
        appIdMasked: null,
        subIds: [],
        status: 'idle',
        lastTestedAt: null,
        lastError: null,
        updatedAt: null,
      };
    }
    const shopee = raw.shopee && typeof raw.shopee === 'object' ? raw.shopee : {};
    const appId = typeof shopee.appId === 'string' ? shopee.appId.trim() : '';
    const hasSecret = isEncryptedToken(shopee.secret);
    return {
      configured: Boolean(appId && hasSecret),
      enabled: shopee.enabled === true,
      appIdMasked: maskAppId(appId),
      subIds: Array.isArray(shopee.subIds) && shopee.subIds.length > 0
        ? shopee.subIds.slice(0, MAX_SUB_IDS)
        : [],
      status: typeof shopee.status === 'string' && shopee.status ? shopee.status : 'idle',
      lastTestedAt: shopee.lastTestedAt || null,
      lastError: shopee.lastError || null,
      updatedAt: raw.updatedAt || null,
    };
  }

  // Define o status de conexão de um marketplace (persistido no arquivo do tenant).
  function setMarketplaceStatus(tenantId, marketplace, patch) {
    const prev = readRaw(tenantId) || {};
    let mkt = { ...(prev[marketplace] || {}) };
    for (const key of Object.keys(patch || {})) {
      if (key === undefined) continue;
      mkt[key] = patch[key];
    }
    if (!mkt.status && mkt.status !== 'idle') mkt.status = 'idle';
    writeRaw(tenantId, { ...prev, [marketplace]: mkt });
  }

  // Testa as credenciais Shopee do tenant contra a API real (gerador injetável
  // para teste). Atualiza status/lastTestedAt/lastError. NUNCA loga segredo.
  async function testShopee(tenantId, options = {}) {
    const raw = readRaw(tenantId);
    const shopee = raw && raw.shopee ? raw.shopee : {};
    const appId = typeof shopee.appId === 'string' ? shopee.appId.trim() : '';
    if (!appId || !shopee.secret) {
      setMarketplaceStatus(tenantId, 'shopee', {
        status: 'idle',
        lastTestedAt: new Date().toISOString(),
        lastError: 'Credenciais Shopee incompletas para testar.',
      });
      return { status: 'idle', error: 'Credenciais Shopee incompletas.' };
    }

    const secret = decryptSecret(shopee.secret, encryptionKey);
    if (!secret) {
      setMarketplaceStatus(tenantId, 'shopee', {
        status: 'error',
        lastTestedAt: new Date().toISOString(),
        lastError: 'Não foi possível decifrar o segredo armazenado.',
      });
      return { status: 'error', error: 'Segredo cifrado ilegível.' };
    }

    const generator =
      typeof options.generateShortLink === 'function'
        ? options.generateShortLink
        : null;
    const generate = generator
      ? generator
      : (payload) =>
          require('./shopeeApiClient.js')
            .createShopeeApiClient({
              credentials: {
                appId,
                secret,
                apiUrl: shopee.apiUrl || null,
              },
            })
            .generateShortLink(payload);

    const sourceUrl =
      typeof options.sourceUrl === 'string' && options.sourceUrl.trim()
        ? options.sourceUrl.trim()
        : 'https://shopee.com.br/item/998877';

    try {
      const result = await generate({
        sourceUrl,
        subIds:
          Array.isArray(shopee.subIds)
            ? shopee.subIds.slice(0, MAX_SUB_IDS)
            : [],
      });
      setMarketplaceStatus(tenantId, 'shopee', {
        status: 'connected',
        lastTestedAt: new Date().toISOString(),
        lastError: null,
      });
      return {
        status: 'connected',
        affiliateUrl:
          result && result.affiliateUrl ? result.affiliateUrl : null,
      };
    } catch (err) {
      setMarketplaceStatus(tenantId, 'shopee', {
        status: 'error',
        lastTestedAt: new Date().toISOString(),
        lastError: sanitizeError(err),
      });
      return { status: 'error', error: sanitizeError(err) };
    }
  }

  return {
    tenantExists,
    listTenants,
    ensureTenant,
    putCredentials,
    getPublicCredentials,
    getShopeeApiCredentials,
    getShopeePublicView,
    setMarketplaceStatus,
    testShopee,
    _internals: {
      encryptSecret,
      decryptSecret,
      isEncryptedToken,
    },
  };
}

function objectHas(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

module.exports = {
  createAffiliateCredentialsStore,
  EncryptionKeyMissingError,
  isEncryptedToken,
  encryptSecret,
  decryptSecret,
};