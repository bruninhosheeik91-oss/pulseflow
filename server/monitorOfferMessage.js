'use strict';

// Motor determinístico de mensagens do Grupo Monitor.
// Usa apenas dados reais já resolvidos pela Shopee Affiliate API.
// Nenhum texto gerado aqui inventa preço, desconto, avaliação ou vendas.

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatBRL(value) {
  const number = toFiniteNumber(value);
  if (number === null) return '';
  return `R$ ${number.toFixed(2).replace('.', ',')}`;
}

function formatSales(value) {
  const number = toFiniteNumber(value);
  if (number === null || number <= 0) return '';
  const sales = Math.floor(number);
  if (sales >= 1000000) {
    return `${(sales / 1000000).toFixed(sales >= 10000000 ? 0 : 1).replace('.', ',')} mi vendas`;
  }
  if (sales >= 1000) {
    return `${(sales / 1000).toFixed(sales >= 10000 ? 0 : 1).replace('.', ',')} mil vendas`;
  }
  return `${sales} vendas`;
}

function stableHash(input) {
  let hash = 2166136261;
  const text = String(input || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickVariant(variants, seed) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  return variants[stableHash(seed) % variants.length];
}

function cleanLines(lines) {
  const output = [];
  let previousBlank = false;
  for (const raw of lines) {
    const line = typeof raw === 'string' ? raw.trim() : '';
    if (!line) {
      if (output.length > 0 && !previousBlank) {
        output.push('');
        previousBlank = true;
      }
      continue;
    }
    output.push(line);
    previousBlank = false;
  }
  while (output[output.length - 1] === '') output.pop();
  return output.join('\n');
}

function buildPriceBlock(offer) {
  const price = toFiniteNumber(offer.price);
  const originalPrice = toFiniteNumber(offer.originalPrice);
  const discount = toFiniteNumber(offer.discountPercentage);
  const lines = [];

  if (price !== null) {
    if (originalPrice !== null && originalPrice > price) {
      lines.push(`De: ~${formatBRL(originalPrice)}~`);
      lines.push(`Por: *${formatBRL(price)}*`);
    } else {
      lines.push(`💰 *${formatBRL(price)}*`);
    }
  }

  if (discount !== null && discount > 0) {
    const normalized = Math.round(discount * 100) / 100;
    lines.push(`🏷️ ${String(normalized).replace('.', ',')}% OFF`);
  }

  return lines;
}

function buildProofBlock(offer) {
  const rating = toFiniteNumber(offer.rating);
  const sales = formatSales(offer.sales);
  const lines = [];

  if (rating !== null && rating > 0) {
    lines.push(`⭐ ${String(Math.round(rating * 10) / 10).replace('.', ',')}/5`);
  }
  if (sales) lines.push(`🛍️ ${sales}`);
  return lines;
}

function classifyOffer(offer) {
  const discount = toFiniteNumber(offer.discountPercentage) || 0;
  const price = toFiniteNumber(offer.price);
  const originalPrice = toFiniteNumber(offer.originalPrice);
  const rating = toFiniteNumber(offer.rating) || 0;
  const sales = toFiniteNumber(offer.sales) || 0;

  if (discount >= 30 && price !== null && originalPrice !== null && originalPrice > price) {
    return 'high_discount';
  }
  if (discount > 0 && price !== null) return 'discount';
  if (rating >= 4.7 && sales >= 50) return 'social_proof';
  if (rating >= 4.7) return 'rating';
  if (sales >= 100) return 'popular';
  if (price !== null) return 'price';
  return 'link_only';
}

const HEADLINES = {
  high_discount: [
    '🔥 *ACHADINHO COM DESCONTO*',
    '⚡ *OFERTA QUE VALE CONFERIR*',
    '💥 *DESCONTO FORTE NA SHOPEE*',
  ],
  discount: [
    '🏷️ *ACHADINHO EM OFERTA*',
    '✨ *PREÇO ESPECIAL NA SHOPEE*',
    '💙 *OLHA ESSE ACHADINHO*',
  ],
  social_proof: [
    '⭐ *ACHADINHO BEM AVALIADO*',
    '🛍️ *PRODUTO QUE ESTÁ SAINDO BEM*',
    '✨ *ACHADINHO COM BOA PROCURA*',
  ],
  rating: [
    '⭐ *ACHADINHO BEM AVALIADO*',
    '✨ *VALE DAR UMA OLHADA*',
    '💙 *ACHADINHO DA SHOPEE*',
  ],
  popular: [
    '🛍️ *ACHADINHO COM BOA PROCURA*',
    '🔥 *OLHA O QUE ENCONTREI*',
    '✨ *ACHADINHO DA VEZ*',
  ],
  price: [
    '💰 *ACHADINHO NA SHOPEE*',
    '✨ *OLHA ESSE PREÇO*',
    '💙 *ACHADINHO DA VEZ*',
  ],
  link_only: [
    '🔗 *OFERTA NA SHOPEE*',
    '✨ *CONFIRA ESTE ACHADINHO*',
    '🛍️ *LINK DA OFERTA*',
  ],
};

const CALLS_TO_ACTION = [
  '👉 Confira aqui:',
  '🛒 Ver oferta:',
  '🔗 Acesse a oferta:',
  '👉 Dá uma olhada:',
];

function buildDynamicMonitorOfferMessage(offer = {}, options = {}) {
  const affiliateUrl =
    typeof offer.affiliateUrl === 'string' ? offer.affiliateUrl.trim() : '';
  if (!affiliateUrl) return '';

  const productName =
    typeof offer.productName === 'string' ? offer.productName.trim() : '';
  const category = classifyOffer(offer);
  const seed =
    options.seed ||
    offer.itemId ||
    `${productName}|${affiliateUrl}`;

  const headline = pickVariant(HEADLINES[category], `${seed}|headline`);
  const callToAction = pickVariant(CALLS_TO_ACTION, `${seed}|cta`);

  const lines = [headline, ''];
  if (productName) lines.push(`*${productName}*`, '');

  const priceBlock = buildPriceBlock(offer);
  if (priceBlock.length) lines.push(...priceBlock, '');

  const proofBlock = buildProofBlock(offer);
  if (proofBlock.length) lines.push(...proofBlock, '');

  lines.push(callToAction, affiliateUrl);
  return cleanLines(lines);
}

module.exports = {
  buildDynamicMonitorOfferMessage,
  classifyOffer,
  formatBRL,
  formatSales,
  stableHash,
};
