'use strict';

const assert = require('assert');
const {
  normalizeMonitorMessage,
  diagnoseMonitorMessage,
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

const nestedData = normalizeMonitorMessage({
  event: 'chat.new_message',
  _data: {
    id: { _serialized: 'true_parent_NESTED001' },
    from: '5511444444444@c.us',
    to: parent,
    fromMe: true,
    body: 'https://s.shopee.com.br/9pNested123',
    type: 'chat',
  },
});
assert(nestedData);
assert.strictEqual(nestedData.messageId, 'true_parent_NESTED001');
assert.strictEqual(nestedData.chatId, parent);
assert.strictEqual(nestedData.body, 'https://s.shopee.com.br/9pNested123');

const nestedMessage = normalizeMonitorMessage({
  fromMe: true,
  message: {
    id: 'true_parent_NESTED002',
    to: { _serialized: parent },
    from: '5511333333333@c.us',
    extendedTextMessage: { text: 'https://s.shopee.com.br/9pNested456' },
    type: 'chat',
  },
});
assert(nestedMessage);
assert.strictEqual(nestedMessage.chatId, parent);
assert.strictEqual(nestedMessage.body, 'https://s.shopee.com.br/9pNested456');

const nestedUrl = normalizeMonitorMessage({
  data: {
    id: 'true_parent_NESTED003',
    to: parent,
    from: '5511222222222@c.us',
    fromMe: true,
    url: 'https://s.shopee.com.br/9pNested789',
    type: 'image',
  },
});
assert(nestedUrl);
assert.strictEqual(nestedUrl.body, 'https://s.shopee.com.br/9pNested789');

// WPPConnect v2.3.3 expõe clientUrl em mensagens de URL. Esse era o caso
// crônico que chegava no onAnyMessage sem body/caption e era descartado.
const clientUrlMessage = normalizeMonitorMessage({
  id: {
    _serialized: `true_${parent}_3EB0CLIENTURL001`,
    id: '3EB0CLIENTURL001',
    fromMe: true,
    remote: { _serialized: parent },
  },
  chatId: { _serialized: parent },
  from: '5511111111111@c.us',
  to: parent,
  fromMe: true,
  clientUrl: 'https://s.shopee.com.br/9fKrjhoA8f',
  type: 'url',
});
assert(clientUrlMessage);
assert.strictEqual(clientUrlMessage.body, 'https://s.shopee.com.br/9fKrjhoA8f');
assert.strictEqual(clientUrlMessage.chatId, parent);

// Se o evento vier sem chatId/to/from, o grupo real pode ser recuperado do
// próprio message id serializado, sem criar identificador artificial.
const chatFromMessageId = normalizeMonitorMessage({
  id: `true_${parent}_3EB0ONLYID001`,
  fromMe: true,
  clientUrl: 'https://s.shopee.com.br/9fOnlyId',
  type: 'url',
});
assert(chatFromMessageId);
assert.strictEqual(chatFromMessageId.chatId, parent);

const missingBodyDiagnosis = diagnoseMonitorMessage({
  id: `true_${parent}_3EB0DIAG001`,
  chatId: parent,
  type: 'url',
});
assert.deepStrictEqual(missingBodyDiagnosis.missing, ['conteudo']);
assert(missingBodyDiagnosis.keys.includes('chatId'));

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
