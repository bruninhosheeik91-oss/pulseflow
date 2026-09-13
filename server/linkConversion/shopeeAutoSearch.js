'use strict';
// ===== Busca Automática Shopee (dados reais) =====
//
// Consulta a Affiliate Open API (productOfferV2) usando SOMENTE as credenciais
// do tenant, normaliza os campos reais para o modelo interno do PULSE FLOW,
// aplica filtros reais (preço, desconto, comissão, vendas, avaliação),
// seleciona produtos por prioridade e gera o short link afiliado
// (generateShortLink) para os aprovados com os Sub IDs do tenant.
//
// Segurança:
//   - credenciais/segredo vêm do store do tenant (nunca do frontend)
//   - o frontend NUNCA chama a Shopee diretamente (tudo ocorre no backend)
//   - sem mocks: somente dados reais retornados pela API
//
// Categorias:
//   - auditaram-se as operações da API: NÃO existe listagem de categorias
//   - productOfferV2 aceita filtro real productCatId:Int e cada nó retorna
//     productCatIds:[Int] — por isso só se usa "Ofertas gerais" ou um ID real
//     informado pelo usuário; NENHUM mapeamento é inventado

const { createShopeeApiClient } = require('./shopeeApiClient');

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 5;

const PRIORITY_ORDER = {
  desconto: 'maior desconto',
  comissao: 'maior comissão',
  vendas: 'mais vendidos',
  avaliacao: 'melhor avaliação',
  variedade: 'variedade',
};

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function sanitizeError(err) {
  if (!err) return 'erro desconhecido.';
  if (err && typeof err.message === 'string') return err.message.slice(0, 300);
  return 'erro desconhecido.';
}

function formatBRL(value) {
  if (value == null) return '—';
  return `R$ ${Number(value).toFixed(2)}`;
}

function formatSales(value) {
  const sales = Number(value) || 0;
  if (sales <= 0) return '0 vendas';
  if (sales >= 1000) {
    return `${(sales / 1000).toFixed(1).replace('.', ',')} mil vendas`;
  }
  return `${sales} vendas`;
}

// Preenche o template com SOMENTE as variáveis realmente suportadas
// (mesmas variáveis/forma do preview no frontend). Dados sempre reais.
function buildMessageFromTemplate(template, product = {}) {
  const source =
    typeof template === 'string' ? template : '';
  if (!source.trim()) return '';
  return source
    .replace(/{{produto}}/g, typeof product.productName === 'string' && product.productName ? product.productName : 'Produto')
    .replace(/{{preco}}/g, formatBRL(product.price))
    .replace(/{{preco_original}}/g, formatBRL(product.originalPrice))
    .replace(/{{desconto}}/g, String(product.discountPercentage ?? 0))
    .replace(/{{comissao}}/g, formatBRL(product.commissionAmount))
    .replace(/{{vendedor}}/g, typeof product.shopName === 'string' && product.shopName ? product.shopName : '—')
    .replace(/{{avaliacao}}/g, product.rating != null ? String(product.rating) : '—')
    .replace(/{{vendas}}/g, formatSales(product.sales))
    .replace(/{{link}}/g, product.affiliateUrl || product.productLink || '');
}

// Normaliza um nó real da API (productOfferV2) para o modelo interno.
// Usa somente campos realmente retornados; campos ausentes viram null/0.
function normalizeShopeeNode(node) {
  if (!node || typeof node !== 'object') return null;
  const price = toNumber(node.price, null);
  const priceMin = toNumber(node.priceMin, null);
  const priceMax = toNumber(node.priceMax, null);
  const discountRate = Math.max(0, toNumber(node.priceDiscountRate, 0) || 0);
  const commissionAmount = toNumber(node.commission, null);
  const commissionRate = toNumber(node.commissionRate, null);
  const rating = toNumber(node.ratingStar, null);
  const sales = Math.max(0, toNumber(node.sales, 0) || 0);
  const categoryIds = Array.isArray(node.productCatIds)
    ? node.productCatIds
        .map((id) => toNumber(id, null))
        .filter((id) => Number.isInteger(id) && id >= 0)
    : [];
  const basePrice = price != null ? price : priceMin;
  const originalPrice =
    basePrice != null && discountRate > 0
      ? basePrice / (1 - discountRate / 100)
      : basePrice;
  const productLink =
    typeof node.productLink === 'string' ? node.productLink : '';
  const offerLink = typeof node.offerLink === 'string' ? node.offerLink : '';
  return {
    itemId: node.itemId ?? null,
    shopId: node.shopId ?? null,
    productName: typeof node.productName === 'string' ? node.productName : '',
    shopName: typeof node.shopName === 'string' ? node.shopName : '',
    imageUrl: typeof node.imageUrl === 'string' ? node.imageUrl : '',
    price: basePrice,
    originalPrice,
    priceMin,
    priceMax,
    discountPercentage: Math.round(discountRate * 100) / 100,
    commissionAmount,
    commissionRate,
    sales,
    rating,
    categoryIds,
    productLink,
    offerLink,
    periodStartTime: node.periodStartTime ?? null,
    periodEndTime: node.periodEndTime ?? null,
  };
}

// Filtros aplicados usando apenas campos reais. Filtro com valor ausente na
// oferta é reprovado (não se aprova oferta que não comprova o critério),
// exceto desconto que assume 0 quando ausente.
function applyFilters(product, criteria = {}) {
  const reasons = [];
  if (!product) return { pass: false, reasons: ['oferta sem dados'] };

  const price = product.price;
  if (
    criteria.minPrice != null &&
    criteria.maxPrice != null &&
    criteria.minPrice > criteria.maxPrice
  ) {
    return { pass: false, reasons: ['intervalo de preço inválido'] };
  }
  if (price == null) {
    if (criteria.minPrice != null || criteria.maxPrice != null) {
      reasons.push('preço indisponível');
    }
  } else {
    if (criteria.minPrice != null && price < criteria.minPrice) {
      reasons.push(`preço R$ ${price} abaixo do mínimo`);
    }
    if (criteria.maxPrice != null && price > criteria.maxPrice) {
      reasons.push(`preço R$ ${price} acima do máximo`);
    }
  }

  if (criteria.minDiscount != null && criteria.minDiscount > 0) {
    if (product.discountPercentage < criteria.minDiscount) {
      reasons.push(
        `desconto ${product.discountPercentage}% abaixo do mínimo`
      );
    }
  }

  if (criteria.minCommission != null && criteria.minCommission > 0) {
    if (
      product.commissionAmount == null ||
      product.commissionAmount < criteria.minCommission
    ) {
      reasons.push('comissão abaixo do mínimo');
    }
  }

  if (criteria.minSales != null && criteria.minSales > 0) {
    if (product.sales < criteria.minSales) {
      reasons.push(`vendas ${product.sales} abaixo do mínimo`);
    }
  }

  if (criteria.minRating != null && criteria.minRating > 0) {
    if (product.rating == null || product.rating < criteria.minRating) {
      reasons.push('avaliação abaixo do mínimo');
    }
  }

  return { pass: reasons.length === 0, reasons };
}

// Ordena/seleciona ofertas aprovadas por prioridade baseada em campos REAIS.
// "variedade" intercala vendedores distintos (round-robin por shopId).
function selectByPriority(products, priority) {
  const list = [...products];
  switch (priority) {
    case 'comissao':
      list.sort((a, b) => (b.commissionAmount ?? -1) - (a.commissionAmount ?? -1));
      break;
    case 'vendas':
      list.sort((a, b) => b.sales - a.sales);
      break;
    case 'avaliacao':
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      break;
    case 'variedade': {
      list.sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0));
      const byShop = new Map();
      for (const item of list) {
        const key = item.shopId != null ? String(item.shopId) : `x${item.itemId}`;
        if (!byShop.has(key)) byShop.set(key, []);
        byShop.get(key).push(item);
      }
      const buckets = [...byShop.values()];
      const out = [];
      let index = 0;
      while (buckets.some((group) => group.length > 0)) {
        const group = buckets[index % buckets.length];
        if (group.length > 0) out.push(group.shift());
        index += 1;
      }
      return out;
    }
    case 'desconto':
    default:
      list.sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0));
      break;
  }
  return list;
}

// Normaliza a configuração/parâmetros de execução. Aceita tanto o formato
// plano ({ limit, minPrice, ... }) quanto o da automação
// ({ maxResults, filters: {...}, categoryId, priority }).
function buildCriteria(raw = {}) {
  const ctx =
    raw.filters && typeof raw.filters === 'object' ? raw.filters : raw;
  return {
    limit: clamp(
      toNumber(
        firstDefined(raw.maxResults, ctx.limit, ctx.maxResults, raw.limit),
        DEFAULT_LIMIT
      ) || DEFAULT_LIMIT,
      1,
      MAX_LIMIT
    ),
    keyword:
      typeof ctx.keyword === 'string' && ctx.keyword.trim()
        ? ctx.keyword.trim()
        : undefined,
    categoryId: toNumber(firstDefined(raw.categoryId, ctx.categoryId), null),
    minPrice: toNumber(ctx.minPrice, null),
    maxPrice: toNumber(ctx.maxPrice, null),
    minDiscount: toNumber(ctx.minDiscount, null),
    minCommission: toNumber(ctx.minCommission, null),
    minSales: toNumber(ctx.minSales, null),
    minRating: toNumber(ctx.minRating, null),
    priority:
      typeof raw.priority === 'string' && PRIORITY_ORDER[raw.priority]
        ? raw.priority
        : 'desconto',
  };
}

// Executa a busca REAL para o tenant. Devolve produtos normalizados com
// status qualified/ignored e short links afiliados (somente aprovados).
async function runSearch({ tenantId, store, criteria: rawCriteria = {} }) {
  const creds = store.getShopeeApiCredentials(tenantId);
  if (!creds) {
    return {
      ok: false,
      error: 'Credenciais Shopee não configuradas para este tenant.',
    };
  }

  const view = store.getShopeePublicView(tenantId);
  const subIds = Array.isArray(view.subIds) ? view.subIds.filter(Boolean) : [];

  const client = createShopeeApiClient({
    credentials: {
      appId: creds.appId,
      secret: creds.secret,
      apiUrl: creds.apiUrl,
    },
  });

  const criteria = buildCriteria(rawCriteria);
  let nodes = [];
  try {
    const result = await client.productOfferV2({
      limit: criteria.limit,
      keyword: criteria.keyword,
      productCatId: criteria.categoryId,
    });
    nodes = Array.isArray(result.nodes) ? result.nodes : [];
  } catch (err) {
    return {
      ok: false,
      error: sanitizeError(err),
      phase: 'productOfferV2',
      filtersApplied: criteria,
    };
  }

  const products = nodes.map(normalizeShopeeNode).filter(Boolean);
  const approved = [];
  const rejected = [];
  for (const product of products) {
    const { pass, reasons } = applyFilters(product, criteria);
    if (pass) {
      approved.push(product);
    } else {
      rejected.push({
        ...product,
        status: 'ignored',
        rejectReason: reasons.join('; '),
      });
    }
  }

  const selected = selectByPriority(approved, criteria.priority);

  let shortLinksGenerated = 0;
  for (const product of selected) {
    const sourceUrl = product.productLink || product.offerLink;
    if (!sourceUrl) {
      product.affiliateUrl = null;
      product.linkError = 'URL de origem indisponível';
      continue;
    }
    try {
      const link = await client.generateShortLink({ sourceUrl, subIds });
      product.affiliateUrl = link.affiliateUrl;
      shortLinksGenerated += 1;
    } catch (err) {
      product.affiliateUrl = null;
      product.linkError = sanitizeError(err);
    }
  }

  return {
    ok: true,
    marketplacesConsulted: 1,
    consulted: products.length,
    qualified: selected.length,
    ignored: rejected.length,
    shortLinksGenerated,
    filtersApplied: criteria,
    products: [
      ...selected.map((p) => ({ ...p, status: 'qualified' })),
      ...rejected,
    ],
  };
}

module.exports = {
  runSearch,
  normalizeShopeeNode,
  applyFilters,
  selectByPriority,
  buildCriteria,
  buildMessageFromTemplate,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  PRIORITY_ORDER,
};