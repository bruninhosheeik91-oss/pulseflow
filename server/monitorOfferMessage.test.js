'use strict';

const assert = require('assert');
const {
  buildDynamicMonitorOfferMessage,
  classifyOffer,
} = require('./monitorOfferMessage.js');

const link = 'https://s.shopee.com.br/teste';

const highDiscount = {
  itemId: 101,
  productName: 'Produto real de teste estrutural',
  price: 69.9,
  originalPrice: 119.9,
  discountPercentage: 42,
  couponCode: 'PULSE10',
  affiliateUrl: link,
};

assert.strictEqual(classifyOffer(highDiscount), 'high_discount');
const message = buildDynamicMonitorOfferMessage(highDiscount);
assert(message.includes('🛍️ *LINK DA OFERTA*'));
assert(message.includes('*Produto real de teste estrutural*'));
assert(message.includes('R$ 119,90'));
assert(message.includes('R$ 69,90'));
assert(message.includes('42% OFF'));
assert(message.includes('🎟️ Cupom: *PULSE10*'));
assert(message.includes('👉 Confira aqui:'));
assert(message.includes(link));
assert(message.includes('Preço e disponibilidade podem mudar'));

const priceOnly = buildDynamicMonitorOfferMessage({
  itemId: 202,
  productName: 'Outro produto real de teste estrutural',
  price: 25,
  affiliateUrl: link,
});
assert(priceOnly.includes('R$ 25,00'));
assert(!priceOnly.includes('OFF'));
assert(!priceOnly.includes('Cupom:'));

const linkOnly = buildDynamicMonitorOfferMessage({ affiliateUrl: link });
assert.strictEqual(
  linkOnly,
  `🛍️ *LINK DA OFERTA*\n\n👉 Confira aqui:\n${link}`,
);
assert.strictEqual(buildDynamicMonitorOfferMessage({}), '');

console.log('monitorOfferMessage: testes OK');
