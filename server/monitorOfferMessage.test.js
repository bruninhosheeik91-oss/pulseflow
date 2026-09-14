'use strict';

const assert = require('assert');
const {
  buildDynamicMonitorOfferMessage,
  buildProductHeadline,
  classifyOffer,
} = require('./monitorOfferMessage.js');

const link = 'https://s.shopee.com.br/teste';
const header = '🛍️ LINK DA OFERTA';
const footer = '⚡ Preço e disponibilidade podem mudar a qualquer momento.';

const highDiscount = {
  itemId: 101,
  productName: 'Kit organizador para cozinha com 10 potes',
  price: 69.9,
  originalPrice: 119.9,
  discountPercentage: 42,
  couponCode: 'PULSE10',
  affiliateUrl: link,
};

assert.strictEqual(classifyOffer(highDiscount), 'high_discount');
assert.strictEqual(
  buildProductHeadline(highDiscount.productName),
  '🏠 *ACHADINHO PARA CASA*',
);
assert.strictEqual(
  buildProductHeadline('Smartphone 5G 256GB'),
  '📱 *ACHADINHO DE TECNOLOGIA*',
);
assert.strictEqual(
  buildProductHeadline('Perfume feminino importado'),
  '💄 *ACHADINHO DE BELEZA*',
);

// Mensagem com todos os dados presentes.
const full = buildDynamicMonitorOfferMessage(highDiscount);
assert.strictEqual(
  full,
  [
    header,
    '',
    'Kit organizador para cozinha com 10 potes',
    '',
    '💰 De: R$ 119,90',
    '🔥 Por: R$ 69,90',
    '🏷️ 42% OFF',
    '',
    '🎟️ Cupom: PULSE10',
    '',
    '👉 Confira aqui:',
    link,
    '',
    footer,
  ].join('\n'),
);
// Sem as antigas marcações bold/riscado.
assert(!full.includes('*'));
assert(!full.includes('~'));

// Produto + preço atual; sem preço original, desconto ou cupom.
const priceOnly = buildDynamicMonitorOfferMessage({
  itemId: 202,
  productName: 'Camiseta básica masculina',
  price: 25,
  affiliateUrl: link,
});
assert.strictEqual(
  priceOnly,
  [
    header,
    '',
    'Camiseta básica masculina',
    '',
    '🔥 Por: R$ 25,00',
    '',
    '👉 Confira aqui:',
    link,
    '',
    footer,
  ].join('\n'),
);

// Sem produto: linha do produto não aparece; demais linhas válidas presentes.
const noProduct = buildDynamicMonitorOfferMessage({
  price: 30,
  affiliateUrl: link,
});
assert.strictEqual(
  noProduct,
  [
    header,
    '',
    '🔥 Por: R$ 30,00',
    '',
    '👉 Confira aqui:',
    link,
    '',
    footer,
  ].join('\n'),
);

// Cupom lido do campo coupon.
const couponField = buildDynamicMonitorOfferMessage({
  affiliateUrl: link,
  coupon: 'SHOPEE5',
});
assert(couponField.includes('🎟️ Cupom: SHOPEE5'));

// Somente link: cabeçalho, confira+link e rodapé sempre presentes.
const linkOnly = buildDynamicMonitorOfferMessage({ affiliateUrl: link });
assert.strictEqual(
  linkOnly,
  [
    header,
    '',
    '👉 Confira aqui:',
    link,
    '',
    footer,
  ].join('\n'),
);

// Dados inválidos/inexistentes nunca geram linha nem placeholders.
const invalidFields = buildDynamicMonitorOfferMessage({
  productName: 'null',
  price: 0,
  originalPrice: 0,
  discountPercentage: 0,
  coupon: 'xxx',
  affiliateUrl: link,
});
for (const banned of ['undefined', 'null', 'xxx', 'NaN', 'R$ 0']) {
  assert(!invalidFields.includes(banned));
}
assert.strictEqual(invalidFields, linkOnly);

assert.strictEqual(buildDynamicMonitorOfferMessage({}), '');

console.log('monitorOfferMessage: testes OK');