'use strict';
// ===== Fluxo canônico do Grupo Monitor =====
// Converte UM evento bruto do listener (onAnyMessage do WPPConnect) em UMA
// mensagem canônica processável — ou descarta o evento de forma silenciosa e
// determinística, ANTES de dedup, admin, Shopee ou distribuição.
//
// Regra: um evento só é processável se tiver os campos de uma mensagem REAL:
//   - identificador estável real da mensagem (messageId);
//   - origem válida (chatId de grupo, sem broadcast/newsletter);
//   - conteúdo textual real (body/caption/content/clientUrl).
// NENHUM id é inventado (sem timestamp, sem hash do texto, sem aleatório).

const { extractUrls } = require('./linkConversion/affiliateLinkConverter.js');
const { isShopeeUrl } = require('./linkConversion/shopeeConverter.js');

const MONITOR_GROUP_ID_REGEX = /^[^\s@]+@g\.us$/i;
const MONITOR_NON_GROUP_REGEX = /@broadcast|@newsletter/i;

function serializedId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value !== 'object') return null;

  const candidates = [
    value._serialized,
    value.serialized,
    value.remote,
    value.remoteJid,
    value.user && value.server ? `${value.user}@${value.server}` : null,
    value.id && typeof value.id === 'string' ? value.id : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

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
      const remote = serializedId(keyObj.remoteJid) || '';
      const fromMe =
        keyObj.fromMe === true ? 'true' : keyObj.fromMe === false ? 'false' : '';
      serialized.push(
        remote && fromMe ? `${remote}_${keyObj.id}_${fromMe}` : keyObj.id
      );
    }
  }

  return serialized.find((s) => typeof s === 'string' && s.trim()) || null;
}

function rawMessageAuthorId(message) {
  if (!message) return null;

  const candidates = [
    message.author,
    message.sender && message.sender.id,
    message.sender,
    message.participant,
    message.id && typeof message.id === 'object' ? message.id.participant : null,
    message.fromMe === true ? message.from : null,
  ];

  for (const candidate of candidates) {
    const normalized = serializedId(candidate);
    if (normalized && !isMonitorGroupChatId(normalized)) return normalized;
  }

  return null;
}

function isMonitorGroupChatId(chatId) {
  return (
    typeof chatId === 'string' &&
    MONITOR_GROUP_ID_REGEX.test(chatId) &&
    !MONITOR_NON_GROUP_REGEX.test(chatId)
  );
}

function rawMonitorChatId(message) {
  if (!message) return null;

  const id = message.id && typeof message.id === 'object' ? message.id : null;
  const key = (id && id.key) || message.key || null;
  const candidates = [
    message.chatId,
    message.from,
    message.to,
    message.chat && message.chat.id,
    id && id.remote,
    id && id.remoteJid,
    key && key.remoteJid,
    message.remote,
    message.remoteJid,
  ];

  for (const candidate of candidates) {
    const normalized = serializedId(candidate);
    if (normalized && isMonitorGroupChatId(normalized)) return normalized;
  }

  // WPPConnect serializa ids de mensagens como true_<chatId>_<id> / false_<chatId>_<id>.
  // Se chatId/to/from não vierem no evento, recuperamos SOMENTE o grupo real já
  // presente no próprio id da mensagem; nada é inventado.
  const messageId = rawMessageId(message);
  if (messageId) {
    const match = messageId.match(/(?:^|_)([^_\s]+@g\.us)(?:_|$)/i);
    if (match && isMonitorGroupChatId(match[1])) return match[1];
  }

  return null;
}

function rawMessageBody(message) {
  if (!message) return '';
  const extended =
    message.extendedTextMessage && typeof message.extendedTextMessage === 'object'
      ? message.extendedTextMessage
      : null;
  const candidates = [
    message.body,
    message.caption,
    message.content,
    message.text,
    message.url,
    // Campo oficial do Message do WPPConnect usado por mensagens de URL/link.
    message.clientUrl,
    extended && extended.text,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return '';
}

function isParentMonitorChat(chatId, parentGroupId) {
  return typeof chatId === 'string' && chatId === parentGroupId;
}

function normalizeOneMonitorMessage(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const messageId = rawMessageId(raw);
  if (!messageId) return null;

  const chatId = rawMonitorChatId(raw);
  if (!chatId) return null;

  const body = rawMessageBody(raw);
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

function monitorCandidates(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const nested = [raw._data, raw.data, raw.message].filter(
    (value) => value && typeof value === 'object' && !Array.isArray(value)
  );
  const candidates = [raw];
  for (const value of nested) {
    candidates.push(value, { ...raw, ...value }, { ...value, ...raw });
  }
  return candidates;
}

// WPPConnect pode entregar o mesmo evento com os campos úteis em wrappers
// internos (_data/data/message). Tentamos o envelope e combinações rasas com
// esses wrappers sem fabricar nenhum id ou conteúdo.
function normalizeMonitorMessage(raw) {
  for (const candidate of monitorCandidates(raw)) {
    const normalized = normalizeOneMonitorMessage(candidate);
    if (normalized) return normalized;
  }
  return null;
}

// Diagnóstico seguro para o terminal: informa exatamente QUAL requisito faltou
// sem registrar corpo da mensagem, URL, credenciais ou conteúdo privado.
function diagnoseMonitorMessage(raw) {
  const candidates = monitorCandidates(raw);
  let hasMessageId = false;
  let hasChatId = false;
  let hasBody = false;
  const types = new Set();
  const keyNames = new Set();

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (rawMessageId(candidate)) hasMessageId = true;
    if (rawMonitorChatId(candidate)) hasChatId = true;
    if (rawMessageBody(candidate)) hasBody = true;
    if (typeof candidate.type === 'string' && candidate.type) types.add(candidate.type);
    Object.keys(candidate).slice(0, 40).forEach((key) => keyNames.add(key));
  }

  const missing = [];
  if (!hasMessageId) missing.push('messageId');
  if (!hasChatId) missing.push('chatIdGrupo');
  if (!hasBody) missing.push('conteudo');

  return {
    missing,
    types: [...types].slice(0, 5),
    keys: [...keyNames].sort().slice(0, 40),
  };
}

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
  diagnoseMonitorMessage,
  createMonitorDeduper,
  resolveMonitorRoute,
};
