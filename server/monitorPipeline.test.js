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

// Evento auxiliar/incompleto do onAnyMessage: deve morrer antes do pipeline.
assert.strictEqual(
  normalizeMonitorMessage({ chatId: parent, body: 'qualquer coisa' }),
  null
);

// Mensagem inbound completa.
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

// Mensagem fromMe completa também precisa ser processável pelo onAnyMessage.
const outbound = normalizeMonitorMessage({
  id: {
    _serialized: 'true_parent_XYZ789',
    id: 'XYZ789',
    fromMe: true,
    remote: parent,
  },
  chatId: parent,
  from: parent,
  fromMe: true,
  body: 'https://shopee.com.br/produto-i.123.456',
  type: 'chat',
});
assert(outbound);
assert.strictEqual(outbound.fromMe, true);
assert.strictEqual(outbound.messageId, 'true_parent_XYZ789');

// Newsletter e evento sem texto não entram no monitor.
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

// Origem mãe/filho é determinística.
assert.strictEqual(isParentMonitorChat(parent, parent), true);
assert.strictEqual(isParentMonitorChat(child, parent), false);

// Roteamento: somente URL Shopee pura entra no afiliado.
const shopeeUrl = 'https://shopee.com.br/produto-i.123.456';
assert.deepStrictEqual(resolveMonitorRoute(shopeeUrl), {
  route: 'shopee',
  url: shopeeUrl,
});
assert.deepStrictEqual(resolveMonitorRoute(`confira ${shopeeUrl}`), {
  route: 'replicate',
  url: null,
});
assert.deepStrictEqual(resolveMonitorRoute('https://example.com/produto'), {
  route: 'replicate',
  url: null,
});

// Dedup opera apenas sobre o id canônico real.
const deduper = createMonitorDeduper();
assert.strictEqual(deduper.isDuplicate('ABC'), false);
deduper.remember('ABC');
assert.strictEqual(deduper.isDuplicate('ABC'), true);
assert.strictEqual(deduper.size(), 1);

console.log('monitorPipeline: testes OK');
