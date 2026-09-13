'use strict';
// ===== Fluxo canônico do Grupo Monitor =====
// Converte UM evento bruto do listener (onAnyMessage do WPPConnect) em UMA
// mensagem canônica processável — ou descarta o evento de forma silenciosa e
// determinística, ANTES de dedup, admin, Shopee ou distribuição.
//
// Regra: um evento só é processável se tiver os campos de uma mensagem REAL:
//   - identificador estável real da mensagem (messageId);
//   - origem válida (chatId de grupo, sem broadcast/newsletter);
//   - conteúdo textual real (body).
// NENHUM id é inventado (sem timestamp, sem hash do texto, sem aleatório).
//
// Listener canônico: onAnyMessage entrega TODAS as mensagens de
// `chat.new_message` (recebidas E enviadas pela própria conta), já com as
// notificações (gp2) filtradas pela biblioteca. onMessage descarta fromMe,
// por isso NÃO é canônico para o Grupo Monitor (links enviados pela própria
// conta precisam chegar ao fluxo afiliado).

const { extractUrls } = require('./linkConversion/affiliateLinkConverter.js');
const { isShopeeUrl } = require('./linkConversion/shopeeConverter.js');

const MONITOR_GROUP_ID_REGEX = /^[^\s@]+@g\.us$/i;
const MONITOR_NON_GROUP_REGEX = /@broadcast|@newsletter/i;

// Normaliza o id da mensagem da API real. O payload serializado do WPPConnect
// v2.3.3 traz message.id como string (o _serialized da MsgKey). Conforme o
// caminho interno pode aparecer também:
//   - message.id objeto { fromMe, id, remote, participant, _serialized };
//   - message.msgKey / message.messageKey (string);
//   - WAMessage cru (wa-js): id em message.key.id (+ remoteJid/fromMe).
// Devolve sempre a MESMA string real para a mesma mensagem (dedup estável).
// Nunca inventa id: sem campo real identificável retorna null.
function rawMessageId(message) {
  if (!message) return null;

  const serialized = [];
  const id = message.id;

  if (typeof id === 'string') {
    serialized.push(id);
  } else if (id && typeof id === 'object') {
    const idObj = id;
    if (typeof idObj._serialized === 'string') serialized.push(idObj._serialized);
    if (typeof idObj.id === 'string') serialized.push(idObj.id);
    if (typeof idObj.msgKey === 'string') serialized.push(idObj.msgKey);
  }

  if (typeof message.msgKey === 'string') serialized.push(message.msgKey);
  if (typeof message.messageKey === 'string') serialized.push(message.messageKey);

  const key = (id && typeof id === 'object' && id.key) || message.key || null;
  if (key && typeof key === 'object') {
    const keyObj = key;
    if (typeof keyObj.id === 'string') {
      const remote = typeof keyObj.remoteJid === 'string' ? keyObj.remoteJid : '';
      const fromMe =
        keyObj.fromMe === true ? 'true' : keyObj.fromMe === false ? 'false' : '';
      serialized.push(
        remote && fromMe ? `${remote}_${keyObj.id}_${fromMe}` : keyObj.id
      );
    }
  }

  return serialized.find((s) => s && s.trim()) || null;
}

// Autor real da mensagem no grupo. Para mensagens de outros membros o WPP
// expõe `author`; para fromMe usamos o contato serializado (a própria conta).
function rawMessageAuthorId(message) {
  if (!message) return null;
  if (message.author) return message.author;
  const sender = message.sender || null;
  if (sender) {
    if (sender.id && typeof sender.id === 'object' && sender.id._serialized) {
      return sender.id._serialized;
    }
    if (typeof sender.id === 'string') return sender.id;
  }
  return message.from || null;
}

// Origem válida para o Grupo Monitor: id de GRUPO real, sem broadcast/newsletter.
function isMonitorGroupChatId(chatId) {
  return (
    typeof chatId === 'string' &&
    MONITOR_GROUP_ID_REGEX.test(chatId) &&
    !MONITOR_NON_GROUP_REGEX.test(chatId)
  );
}

// A mensagem canônica pertence ao Grupo Mãe configurado?
function isParentMonitorChat(chatId, parentGroupId) {
  return typeof chatId === 'string' && chatId === parentGroupId;
}

// Normalizador ÚNICO do pipeline. Retorna a mensagem canônica ou null quando
// o evento bruto não é uma mensagem processável (auxiliar/incompleta).
function normalizeMonitorMessage(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const messageId = rawMessageId(raw);
  if (!messageId) return null;

  const chatId = typeof raw.chatId === 'string' ? raw.chatId : raw.from || null;
  if (!isMonitorGroupChatId(chatId)) return null;

  const body = typeof raw.body === 'string' ? raw.body.trim() : '';
  if (!body) return null;

  return {
    messageId,
    chatId,
    authorId: rawMessageAuthorId(raw),
    fromMe: raw.fromMe === true,
    body,
    type: typeof raw.type === 'string' && raw.type ? raw.type : 'unknown',
  };
}

// Deduplicação em memória operando SOMENTE sobre messageId real/canônico.
// Instância única por processo (mesmos resultados da fase anterior).
function createMonitorDeduper() {
  const seen = new Set();
  return {
    isDuplicate(messageId) {
      return seen.has(messageId);
    },
    remember(messageId) {
      seen.add(messageId);
    },
    size() {
      return seen.size;
    },
  };
}

// Roteia o conteúdo de uma mensagem já canônica/validada:
//   - SOMENTE UMA URL Shopee (sem texto ao redor) -> fluxo afiliado;
//   - qualquer outro formato -> replicação normal de texto.
function resolveMonitorRoute(body) {
  const urls = extractUrls(body);
  const shopeeUrl =
    urls.length === 1 &&
    isShopeeUrl(urls[0].url) &&
    (body === urls[0].url || body === urls[0].raw)
      ? urls[0].url
      : null;
  return shopeeUrl
    ? { route: 'shopee', url: shopeeUrl }
    : { route: 'replicate', url: null };
}

module.exports = {
  rawMessageId,
  rawMessageAuthorId,
  isMonitorGroupChatId,
  isParentMonitorChat,
  normalizeMonitorMessage,
  createMonitorDeduper,
  resolveMonitorRoute,
};