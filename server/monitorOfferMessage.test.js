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
  rating: 4.9,
  sales: 1234,
  affiliateUrl: link,
};

assert.strictEqual(classifyOffer(highDiscount), 'high_discount');
const messageA = buildDynamicMonitorOfferMessage(highDiscount);
const messageB = buildDynamicMonitorOfferMessage(highDiscount);
assert.strictEqual(messageA, messageB, 'mesma oferta deve ter variação estável');
assert(messageA.includes(link), 'link afiliado é obrigatório');
assert(messageA.includes('R$ 69,90'), 'preço real deve aparecer');
assert(messageA.includes('42% OFF'), 'desconto real deve aparecer');
assert(messageA.includes('4,9/5'), 'avaliação real deve aparecer');
assert(messageA.includes('1,2 mil vendas'), 'vendas reais devem aparecer');

const noDiscount = buildDynamicMonitorOfferMessage({
  itemId: 202,
  productName: 'Outro produto real de teste estrutural',
  price: 25,
  affiliateUrl: link,
});
assert(noDiscount.includes('R$ 25,00'));
assert(!noDiscount.includes('OFF'));
assert(!noDiscount.includes('/5'));
assert(!noDiscount.includes('vendas'));

const linkOnly = buildDynamicMonitorOfferMessage({ affiliateUrl: link });
assert(linkOnly.includes(link));
assert(!linkOnly.includes('R$'));
assert.strictEqual(buildDynamicMonitorOfferMessage({}), '');

console.log('monitorOfferMessage: testes OK');
