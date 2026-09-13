'use strict';
// ===== TESTE REAL SHOPEE POR TENANT =====
//
// Usa as credenciais Shopee armazenadas pelo cliente na tela Programas de
// Afiliados (server/data/credentials/<tenantId>.json) e executa operações REAIS
// contra a Affiliate Open API da Shopee. NÃO usa credenciais globais (.env).
//
// Como rodar:
//   1. Garanta que credenciais reais existam para o tenant (via API
//      POST /api/affiliate/credentials/shopee ou modo --seed abaixo).
//   2. Defina ENCRYPTION_KEY (mesma usada pelo backend) e o tenant:
//        $env:ENCRYPTION_KEY="<hex64>"
//        node linkConversion/test-real-shopee-by-tenant.js <tenantId>
//
// Modo desenvolvimento (grava credenciais reais cifradas para o tenant;
// NUNCA passe o secret por argumento):
//        $env:ENCRYPTION_KEY="<hex64>"
//        $env:SHOPEE_TENANT_TEST_APP_ID="<appId>"
//        $env:SHOPEE_TENANT_TEST_SECRET="<secret>"
//        node linkConversion/test-real-shopee-by-tenant.js <tenantId> --seed
//
// SEGURANÇA:
//   - credenciais somente do tenant indicado (store multi-tenant)
//   - o script NUNCA exibe o secret, a assinatura nem o header Authorization
//   - appId exibido apenas mascarado (view pública do store)
//   - resultados sanitizados no stdout (JSON legível)

const path = require('node:path');
const { createAffiliateCredentialsStore } = require('./affiliateCredentialsStore');
const {
  createShopeeApiClient,
  ShopeeAffiliateApiError,
  ShopeeAffiliateCredentialError,
} = require('./shopeeApiClient');

const TENANT_ID = process.argv[2] || process.env.TENANT_ID || null;
const ENCRYPTION_KEY = String(process.env.ENCRYPTION_KEY || '');
const SUB_ID = String(process.env.SHOPEE_TENANT_TEST_SUB_ID || 'PULSETESTE').trim();

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEED_MODE = process.argv.includes('--seed');

function logReport(block, ok, extra) {
  console.log(
    JSON.stringify({ bloco: block, ok: Boolean(ok), ...(extra || {}) }, null, 2)
  );
}

function sanitizeError(err) {
  if (!err) return 'erro desconhecido.';
  if (err instanceof ShopeeAffiliateApiError || err instanceof Error) {
    return String(err.message || 'erro desconhecido.').slice(0, 300);
  }
  return 'erro desconhecido.';
}

function maskAppIdPublic(store, tenantId) {
  try {
    return store.getShopeePublicView(tenantId).appIdMasked;
  } catch {
    return null;
  }
}

const REQUIRED_FIELDS = [
  'itemId',
  'shopId',
  'productName',
  'shopName',
  'imageUrl',
  'price',
  'priceMin',
  'priceMax',
  'priceDiscountRate',
  'commission',
  'commissionRate',
  'sales',
  'ratingStar',
  'productLink',
  'offerLink',
  'periodStartTime',
  'periodEndTime',
];

function reportProductFields(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { quantity: 0, fields_presentes: [], fields_obrigatorios_presentes: [] };
  }
  const keys = new Set();
  for (const node of nodes) {
    for (const key of Object.keys(node || {})) keys.add(key);
  }
  const fieldsPresentes = REQUIRED_FIELDS.filter((f) => keys.has(f));
  const sample = nodes
    .slice(0, 2)
    .map((n) => ({
      itemId: n.itemId ?? null,
      shopId: n.shopId ?? null,
      productName:
        typeof n.productName === 'string' ? n.productName.slice(0, 90) : null,
      price: n.price ?? null,
      priceMin: n.priceMin ?? null,
      priceMax: n.priceMax ?? null,
      priceDiscountRate: n.priceDiscountRate ?? null,
      commission: n.commission ?? null,
      commissionRate: n.commissionRate ?? null,
      productLink:
        typeof n.productLink === 'string' ? n.productLink.slice(0, 160) : null,
    }));
  return {
    quantity: nodes.length,
    fields_presentes: fieldsPresentes,
    campos_disponiveis: [...keys].slice(0, 40),
    amostra: sample,
  };
}

async function main() {
  if (!TENANT_ID) {
    console.error(
      'Uso: node linkConversion/test-real-shopee-by-tenant.js <tenantId> [--seed]'
    );
    process.exit(1);
  }
  if (!ENCRYPTION_KEY) {
    console.error('ENCRYPTION_KEY (hex 32 bytes) é obrigatória no processo.');
    process.exit(1);
  }

  const store = createAffiliateCredentialsStore({
    encryptionKey: ENCRYPTION_KEY,
    dataDir: DATA_DIR,
  });

  // Sub IDs configurados no tenant (ex.: ['whatsapp']). Usados no
  // generateShortLink; fallback para SUB_ID de ambiente se vazio.
  const tenantSubIds = (() => {
    try {
      const view = store.getShopeePublicView(TENANT_ID);
      return Array.isArray(view.subIds) ? view.subIds.filter(Boolean) : [];
    } catch {
      return [];
    }
  })();

  // === Modo --seed (desenvolvimento): grava credenciais reais cifradas ===
  if (SEED_MODE) {
    const appId = String(process.env.SHOPEE_TENANT_TEST_APP_ID || '').trim();
    const secret = String(process.env.SHOPEE_TENANT_TEST_SECRET || '').trim();
    if (!appId || !secret) {
      console.error(
        'Modo --seed exige SHOPEE_TENANT_TEST_APP_ID e SHOPEE_TENANT_TEST_SECRET no ambiente.'
      );
      process.exit(1);
    }
    store.putCredentials(TENANT_ID, { shopee: { appId, secret } });
    console.log(
      `OK: credenciais cifradas gravadas para tenant=${TENANT_ID} (nunca em texto plano).`
    );
    return;
  }

  // === Modo teste real: lê e decifra as credenciais do tenant ===
  const creds = store.getShopeeApiCredentials(TENANT_ID);
  const appIdMasked = maskAppIdPublic(store, TENANT_ID);
  if (!creds) {
    logReport('CREDENCIAIS_TENANT', false, {
      tenant: TENANT_ID,
      appIdMasked,
      erro: 'Tenant sem credenciais Shopee válidas armazenadas. Use o modo --seed ou cadastre pela tela Programas de Afiliados (back end).',
    });
    logReport('CONEXAO_SHOPEE', false, {
      erro: 'Sem credenciais do tenant para executar operação real.',
    });
    logReport('GENERATE_SHORT_LINK', false, {
      erro: 'Não executado (sem credenciais do tenant).',
    });
    logReport('PRODUCT_OFFER_V2', false, {
      erro: 'Não executado (sem credenciais do tenant).',
      quantity: 0,
    });
    console.log(
      `\nRESUMO: conexaoShopee=ERRO generateShortLink=ERRO productOfferV2=ERRO (tenant=${TENANT_ID})`
    );
    return;
  }

  logReport('CREDENCIAIS_TENANT', true, { tenant: TENANT_ID, appIdMasked });

  const client = createShopeeApiClient({
    credentials: { appId: creds.appId, secret: creds.secret, apiUrl: creds.apiUrl },
  });

  // === 1) CONEXÃO real (primeira chamada autenticada à API) ===
  let connectionOk = false;
  let productsOk = false;
  let shortLinkOk = false;
  let productNodes = [];
  try {
    const offerResult = await client.productOfferV2({ pageSize: 5 });
    connectionOk = true;
    productNodes = Array.isArray(offerResult.nodes) ? offerResult.nodes : [];
  } catch (err) {
    connectionOk = false;
    logReport('CONEXAO_SHOPEE', false, { erro: sanitizeError(err) });
  }

  if (connectionOk) {
    logReport('CONEXAO_SHOPEE', true, {
      mensagem: 'Autenticação e assinatura aceitas pela Affiliate Open API (HTTP 200).',
    });
  }

  // === 2) PRODUCT_OFFER_V2 (produtos reais, sem mock) ===
  if (!connectionOk) {
    logReport('PRODUCT_OFFER_V2', false, {
      erro: 'Não executado (falha na conexão/autenticação).',
      quantity: 0,
    });
  } else {
    logReport('PRODUCT_OFFER_V2', true, reportProductFields(productNodes));
    productsOk = true;
  }

  // === 3) GENERATE_SHORT_LINK (URL real de teste) ===
  if (!connectionOk) {
    logReport('GENERATE_SHORT_LINK', false, {
      erro: 'Não executado (falha na conexão/autenticação).',
    });
  } else {
    // Escolhe o 1º produto real retornado pela própria API; se não houver,
    // tenta uma URL Shopee genérica (pode falhar → ERRO sanitizado é válido).
    const chosen = productNodes[0] || null;
    const sourceUrl =
      chosen && chosen.productLink
        ? String(chosen.productLink).trim()
        : 'https://shopee.com.br/product/998877';
    const subIds = tenantSubIds.length > 0 ? tenantSubIds : SUB_ID ? [SUB_ID] : [];
    try {
      const linkResult = await client.generateShortLink({
        sourceUrl,
        subIds,
      });
      logReport('GENERATE_SHORT_LINK', true, {
        sourceUrl: sourceUrl.slice(0, 200),
        subId: subIds.join(', '),
        produto: {
          itemId: chosen ? chosen.itemId ?? null : null,
          productName:
            chosen && typeof chosen.productName === 'string'
              ? chosen.productName.slice(0, 90)
              : null,
          price: chosen ? chosen.price ?? null : null,
          priceMin: chosen ? chosen.priceMin ?? null : null,
          priceMax: chosen ? chosen.priceMax ?? null : null,
          commission: chosen ? chosen.commission ?? null : null,
          commissionRate: chosen ? chosen.commissionRate ?? null : null,
        },
        affiliateUrl: String(linkResult.affiliateUrl).slice(0, 200),
      });
      shortLinkOk = true;
    } catch (err) {
      logReport('GENERATE_SHORT_LINK', false, {
        sourceUrl: sourceUrl.slice(0, 200),
        subId: subIds.join(', '),
        erro: sanitizeError(err),
      });
    }
  }

  const resumo = {
    conexaoShopee: connectionOk ? 'OK' : 'ERRO',
    productOfferV2: productsOk ? 'OK' : 'ERRO',
    generateShortLink: shortLinkOk ? 'OK' : 'ERRO',
  };
  console.log(
    `\nRESUMO: conexaoShopee=${resumo.conexaoShopee} generateShortLink=${resumo.generateShortLink} productOfferV2=${resumo.productOfferV2} (tenant=${TENANT_ID})`
  );
}

main().catch((err) => {
  console.error('Falha fatal no teste:', sanitizeError(err));
  process.exit(1);
});