'use strict';

const assert = require('assert');
const {
  buildDynamicMonitorOfferMessage,
  buildProductHeadline,
  classifyOffer,
} = require('./monitorOfferMessage.js');

const link = 'https://s.shopee.com.br/teste';

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

const message = buildDynamicMonitorOfferMessage(highDiscount);
assert(message.startsWith('🛍️ *LINK DA OFERTA*'));
assert(message.includes('*Kit organizador para cozinha com 10 potes*'));
assert(message.includes('💰 De: ~R$ 119,90~'));
assert(message.includes('🔥 Por: *R$ 69,90*'));
assert(message.includes('🏷️ 42% OFF'));
assert(message.includes('🎟️ Cupom: *PULSE10*'));
assert(message.includes('👉 Confira aqui:'));
assert(message.includes(link));
assert(message.includes('Preço e disponibilidade podem mudar'));

const priceOnly = buildDynamicMonitorOfferMessage({
  itemId: 202,
  productName: 'Camiseta básica masculina',
  price: 25,
  affiliateUrl: link,
});
assert(priceOnly.startsWith('🛍️ *LINK DA OFERTA*'));
assert(priceOnly.includes('🔥 Por: *R$ 25,00*'));
assert(!priceOnly.includes('💰 De:'));
assert(!priceOnly.includes('OFF'));
assert(!priceOnly.includes('Cupom:'));

const linkOnly = buildDynamicMonitorOfferMessage({ affiliateUrl: link });
assert.strictEqual(
  linkOnly,
  `🛍️ *LINK DA OFERTA*\n\n👉 Confira aqui:\n${link}`,
);
assert.strictEqual(buildDynamicMonitorOfferMessage({}), '');

console.log('monitorOfferMessage: testes OK');
