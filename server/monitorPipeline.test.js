'use strict';

const assert = require('assert');
const {
  normalizeMonitorMessage,
  createMonitorDeduper,
  resolveMonitorRoute,
  isParentMonitorChat,
} = require('./monitorPipeline.js');

const parent = '120363429412966849@g.us';
const child = '120363426316518174@g.us';

assert.strictEqual(
  normalizeMonitorMessage({ chatId: parent, body: 'qualquer coisa' }),
  null
);

const inbound = normalizeMonitorMessage({
  id: 'false_parent_ABC123',
  chatId: parent,
  author: '5511999999999@c.us',
  fromMe: false,
  body: 'mensagem real',
  type: 'chat',
});
assert(inbound);
assert.strictEqual(inbound.messageId, 'false_parent_ABC123');
assert.strictEqual(inbound.chatId, parent);
assert.strictEqual(inbound.fromMe, false);
assert.strictEqual(inbound.body, 'mensagem real');

const outbound = normalizeMonitorMessage({
  id: {
    _serialized: 'true_parent_XYZ789',
    id: 'XYZ789',
    fromMe: true,
    remote: parent,
  },
  chatId: parent,
  from: '5511888888888@c.us',
  to: parent,
  fromMe: true,
  body: 'https://shopee.com.br/produto-i.123.456',
  type: 'chat',
});
assert(outbound);
assert.strictEqual(outbound.fromMe, true);
assert.strictEqual(outbound.messageId, 'true_parent_XYZ789');
assert.strictEqual(outbound.chatId, parent);
assert.strictEqual(outbound.authorId, '5511888888888@c.us');

const outgoingObjectJid = normalizeMonitorMessage({
  id: {
    _serialized: 'true_parent_OBJ001',
    id: 'OBJ001',
    fromMe: true,
    remote: { _serialized: parent },
  },
  chatId: { _serialized: parent },
  from: { _serialized: '5511777777777@c.us' },
  to: { _serialized: parent },
  sender: { id: { _serialized: '5511777777777@c.us' } },
  fromMe: true,
  body: 'https://shopee.com.br/outro-produto-i.321.654',
  type: 'chat',
});
assert(outgoingObjectJid);
assert.strictEqual(outgoingObjectJid.chatId, parent);
assert.strictEqual(outgoingObjectJid.authorId, '5511777777777@c.us');

const outgoingViaTo = normalizeMonitorMessage({
  id: 'true_parent_TO001',
  from: '5511666666666@c.us',
  to: parent,
  fromMe: true,
  body: 'https://shopee.com.br/produto-i.999.888',
  type: 'chat',
});
assert(outgoingViaTo);
assert.strictEqual(outgoingViaTo.chatId, parent);

const captionMessage = normalizeMonitorMessage({
  id: 'false_parent_CAP001',
  chatId: { _serialized: parent },
  author: { _serialized: '5511555555555@c.us' },
  fromMe: false,
  caption: 'https://shopee.com.br/produto-i.111.222',
  type: 'image',
});
assert(captionMessage);
assert.strictEqual(captionMessage.body, 'https://shopee.com.br/produto-i.111.222');

assert.strictEqual(
  normalizeMonitorMessage({
    id: 'NEWS1',
    chatId: '120363404922070546@newsletter',
    body: 'texto',
  }),
  null
);
assert.strictEqual(
  normalizeMonitorMessage({ id: 'NO_BODY', chatId: parent, body: '' }),
  null
);

assert.strictEqual(isParentMonitorChat(parent, parent), true);
assert.strictEqual(isParentMonitorChat(child, parent), false);

const shopeeUrl = 'https://shopee.com.br/produto-i.123.456';
assert.deepStrictEqual(resolveMonitorRoute(shopeeUrl), {
  route: 'shopee',
  url: shopeeUrl,
});

const shopeeBrazilShortUrl = 'https://s.shopee.com.br/9pTeste123';
assert.deepStrictEqual(resolveMonitorRoute(shopeeBrazilShortUrl), {
  route: 'shopee',
  url: shopeeBrazilShortUrl,
});

assert.deepStrictEqual(resolveMonitorRoute(`confira ${shopeeUrl}`), {
  route: 'replicate',
  url: null,
});
assert.deepStrictEqual(resolveMonitorRoute('https://example.com/produto'), {
  route: 'replicate',
  url: null,
});

const deduper = createMonitorDeduper();
assert.strictEqual(deduper.isDuplicate('ABC'), false);
deduper.remember('ABC');
assert.strictEqual(deduper.isDuplicate('ABC'), true);
assert.strictEqual(deduper.size(), 1);

console.log('monitorPipeline: testes OK');
