'use strict';

// Modelo oficial de mensagem de oferta do Grupo Monitor.
// Usa apenas dados reais já resolvidos pela integração de afiliados.
// Nunca inventa preço, desconto, cupom, avaliação ou vendas.

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatBRL(value) {
  const number = toFiniteNumber(value);
  if (number === null) return '';
  return `R$ ${number.toFixed(2).replace('.', ',')}`;
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
      lines.push(`💰 De: ~${formatBRL(originalPrice)}~`);
      lines.push(`🔥 Por: *${formatBRL(price)}*`);
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

function buildCouponBlock(offer) {
  const coupon =
    typeof offer.coupon === 'string'
      ? offer.coupon.trim()
      : typeof offer.couponCode === 'string'
        ? offer.couponCode.trim()
        : '';

  if (!coupon) return [];
  return [`🎟️ Cupom: *${coupon}*`];
}

function classifyOffer(offer) {
  const discount = toFiniteNumber(offer.discountPercentage) || 0;
  const price = toFiniteNumber(offer.price);
  const originalPrice = toFiniteNumber(offer.originalPrice);

  if (discount >= 30 && price !== null && originalPrice !== null && originalPrice > price) {
    return 'high_discount';
  }
  if (discount > 0 && price !== null) return 'discount';
  if (price !== null) return 'price';
  return 'link_only';
}

function buildDynamicMonitorOfferMessage(offer = {}) {
  const affiliateUrl =
    typeof offer.affiliateUrl === 'string' ? offer.affiliateUrl.trim() : '';

  if (!affiliateUrl) return '';

  const productName =
    typeof offer.productName === 'string' ? offer.productName.trim() : '';

  const lines = ['🛍️ *LINK DA OFERTA*', ''];

  if (productName) {
    lines.push(`*${productName}*`, '');
  }

  const priceBlock = buildPriceBlock(offer);
  if (priceBlock.length) {
    lines.push(...priceBlock, '');
  }

  const couponBlock = buildCouponBlock(offer);
  if (couponBlock.length) {
    lines.push(...couponBlock, '');
  }

  lines.push('👉 Confira aqui:', affiliateUrl);

  if (priceBlock.length || couponBlock.length) {
    lines.push('', '⚡ Preço e disponibilidade podem mudar a qualquer momento.');
  }

  return cleanLines(lines);
}

module.exports = {
  buildDynamicMonitorOfferMessage,
  classifyOffer,
  formatBRL,
};
