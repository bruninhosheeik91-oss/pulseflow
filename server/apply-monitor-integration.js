'use strict';

// One-time, deterministic migration of server/server.js.
// It fixes the canonical monitor pipeline integration left half-applied by the
// previous refactor and wires the dynamic offer-message engine without touching
// unrelated WhatsApp/Shopee routes. Safe to run more than once.

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let source = fs.readFileSync(serverPath, 'utf8');
let changed = false;

function replaceOnce(label, before, after) {
  if (source.includes(after)) return;
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`[patch] padrão não encontrado: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`[patch] padrão ambíguo (mais de uma ocorrência): ${label}`);
  }
  source = source.slice(0, first) + after + source.slice(first + before.length);
  changed = true;
}

// 1) Motor dinâmico isolado.
replaceOnce(
  'import monitorOfferMessage',
  "const { createShopeeApiClient } = require('./linkConversion/shopeeApiClient.js');\n",
  "const { createShopeeApiClient } = require('./linkConversion/shopeeApiClient.js');\nconst { buildDynamicMonitorOfferMessage } = require('./monitorOfferMessage.js');\n"
);

// 2) Config explícita: dinâmico é o padrão; custom preserva o template legado.
replaceOnce(
  'messageMode default',
  "  template: null,\n  tenantId: null,\n",
  "  template: null,\n  messageMode: 'dynamic',\n  tenantId: null,\n"
);

// 3) Produto real: disponibiliza também os sinais usados pelo motor dinâmico.
replaceOnce(
  'offer product fields',
  "    offer.productName = product.productName;\n    offer.price = product.price;\n    offer.originalPrice = product.originalPrice;\n    offer.discountPercentage = product.discountPercentage;\n    offer.imageUrl = product.imageUrl;\n",
  "    offer.itemId = product.itemId;\n    offer.productName = product.productName;\n    offer.price = product.price;\n    offer.originalPrice = product.originalPrice;\n    offer.discountPercentage = product.discountPercentage;\n    offer.rating = product.rating;\n    offer.sales = product.sales;\n    offer.shopName = product.shopName;\n    offer.commissionAmount = product.commissionAmount;\n    offer.imageUrl = product.imageUrl;\n"
);

// 4) Mensagem: modo dinâmico por padrão; template custom continua disponível.
replaceOnce(
  'dynamic message builder',
  "  const message = buildMonitorOfferMessage(cfg.template, offer);\n  if (!message) {\n    cfg.lastMessageAt = new Date().toISOString();\n    cfg.lastMessageId = msgId;\n    cfg.lastError = 'Template do monitor gerou mensagem vazia.';\n",
  "  const messageMode = cfg.messageMode === 'custom' ? 'custom' : 'dynamic';\n  const message =\n    messageMode === 'custom'\n      ? buildMonitorOfferMessage(cfg.template, offer)\n      : buildDynamicMonitorOfferMessage(offer, { seed: offer.itemId || msgId });\n  monitorLog(sessionId, `mensagem de oferta montada (modo=${messageMode})`);\n  if (!message) {\n    cfg.lastMessageAt = new Date().toISOString();\n    cfg.lastMessageId = msgId;\n    cfg.lastError = 'Não foi possível montar a mensagem da oferta.';\n"
);

// 5) Corrige estruturalmente o handler do monitor: o refactor anterior importou
// normalizeMonitorMessage/resolveMonitorRoute/createMonitorDeduper, mas deixou o
// corpo legado referenciando rawMessageId/processedMessageIds/extractUrls. Isso
// só falhava em runtime. Agora TODO evento passa por um único normalizador.
const handlerStart = source.indexOf('async function handleMonitorReplication(sessionId, message) {');
const handlerEndMarker = '\n// ===== Mapeamento de estados do WPPConnect =====';
const handlerEnd = source.indexOf(handlerEndMarker, handlerStart);
if (handlerStart < 0 || handlerEnd < 0) {
  throw new Error('[patch] não foi possível localizar handleMonitorReplication');
}
const currentHandler = source.slice(handlerStart, handlerEnd);
if (!currentHandler.includes('const canonical = normalizeMonitorMessage(message);')) {
  const canonicalHandler = `async function handleMonitorReplication(sessionId, message) {
  const cfg = getAccountMonitor(sessionId);
  try {
    if (!message) return;
    if (!isMonitorActive(cfg)) {
      monitorLog(sessionId, 'mensagem recebida (monitor desativado - ignorada)');
      return;
    }

    const canonical = normalizeMonitorMessage(message);
    if (!canonical) {
      monitorLog(sessionId, 'evento auxiliar/incompleto ignorado');
      return;
    }

    const parentId = cfg.parentGroupId;
    if (canonical.chatId !== parentId) {
      monitorLog(sessionId, 'origem ignorada: não é o grupo mãe configurado');
      return;
    }

    const msgId = canonical.messageId;
    if (monitorDeduper.isDuplicate(msgId)) {
      monitorLog(sessionId, 'mensagem duplicada ignorada');
      return;
    }
    // Reserva o id antes de qualquer await: dois eventos concorrentes com o
    // mesmo id nunca atravessam o pipeline ao mesmo tempo.
    monitorDeduper.remember(msgId);
    monitorLog(sessionId, 'mensagem canônica recebida');
    monitorLog(sessionId, 'grupo mãe validado');

    const monClient = getSessionState(sessionId).client;
    if (!monClient || typeof monClient.getGroupAdmins !== 'function') {
      monitorLog(sessionId, 'cliente indisponível - autor não autorizado (falha segura)');
      return;
    }

    const adminNumbers = await ensureGroupAdminNumbers(monClient, sessionId, parentId);
    if (!adminNumbers) {
      monitorLog(sessionId, 'não foi possível confirmar admins - autor não autorizado');
      return;
    }
    const authorNumber = canonicalNumber(canonical.authorId);
    if (!authorNumber || !adminNumbers.has(authorNumber)) {
      monitorLog(sessionId, 'autor não autorizado');
      return;
    }
    monitorLog(sessionId, 'autor validado (admin do grupo mãe)');

    const route = resolveMonitorRoute(canonical.body);
    if (route.route === 'shopee' && route.url) {
      monitorLog(sessionId, 'link Shopee detectado');
      await handleMonitorAffiliateLink(sessionId, cfg, route.url, msgId);
      return;
    }

    const children = Array.isArray(cfg.childGroupIds)
      ? cfg.childGroupIds.filter((id) => id && id !== parentId)
      : [];
    if (!children.length) {
      cfg.lastMessageAt = new Date().toISOString();
      cfg.lastMessageId = msgId;
      cfg.lastError = 'Nenhum grupo filho configurado.';
      saveMonitorConfig();
      monitorErrorLog(sessionId, \`erro no envio: \${cfg.lastError}\`);
      return;
    }

    // Replicação comum preserva o escopo atual: primeiro grupo filho.
    const target = children[0];
    const st = getSessionState(sessionId);
    if (!st.client || typeof st.client.sendText !== 'function') {
      cfg.lastMessageAt = new Date().toISOString();
      cfg.lastMessageId = msgId;
      cfg.lastError = 'Cliente WhatsApp indisponível.';
      saveMonitorConfig();
      monitorErrorLog(sessionId, \`erro no envio: \${cfg.lastError}\`);
      return;
    }

    let sent = null;
    try {
      sent = await st.client.sendText(target, canonical.body);
    } catch (err) {
      cfg.lastMessageAt = new Date().toISOString();
      cfg.lastMessageId = msgId;
      cfg.lastError = String((err && err.message) || err);
      saveMonitorConfig();
      monitorErrorLog(sessionId, \`erro no envio: \${cfg.lastError}\`);
      return;
    }

    const sentId =
      (sent && sent.id && (sent.id._serialized || sent.id.id)) || null;
    const now = new Date().toISOString();
    cfg.lastMessageAt = now;
    cfg.lastMessageId = msgId;
    cfg.lastSendAt = now;
    cfg.lastSendMessageId = sentId;
    cfg.lastError = null;
    saveMonitorConfig();
    monitorLog(sessionId, 'replicação concluída com sucesso');
  } catch (err) {
    monitorErrorLog(
      sessionId,
      \`falha no processamento: \${String((err && err.message) || err)}\`
    );
  }
}
`;
  source = source.slice(0, handlerStart) + canonicalHandler + source.slice(handlerEnd);
  changed = true;
}

// 6) API de configuração expõe o modo sem quebrar configs antigas.
replaceOnce(
  'monitor status messageMode',
  "    template: cfg.template ?? DEFAULT_MONITOR_TEMPLATE,\n    tenantId: cfg.tenantId ?? null,\n",
  "    template: cfg.template ?? DEFAULT_MONITOR_TEMPLATE,\n    messageMode: cfg.messageMode === 'custom' ? 'custom' : 'dynamic',\n    tenantId: cfg.tenantId ?? null,\n"
);

replaceOnce(
  'monitor POST destructuring messageMode',
  "  const { enabled, parentGroupId, childGroupIds, sessionId, template, tenantId } =\n    req.body || {};\n",
  "  const { enabled, parentGroupId, childGroupIds, sessionId, template, messageMode, tenantId } =\n    req.body || {};\n"
);

replaceOnce(
  'monitor POST messageMode validation',
  "  if (tenantId !== undefined) {\n",
  "  if (messageMode !== undefined) {\n    if (messageMode === 'dynamic' || messageMode === 'custom') {\n      cfg.messageMode = messageMode;\n    } else {\n      return res.status(400).json({ ok: false, error: 'messageMode invalido.' });\n    }\n  }\n\n  if (tenantId !== undefined) {\n"
);

// Segundo response do POST /api/monitor. O primeiro já foi atualizado pelo
// replace do status; aqui procuramos a ocorrência restante.
const postResponseNeedle = "    template: cfg.template ?? DEFAULT_MONITOR_TEMPLATE,\n    tenantId: cfg.tenantId ?? null,\n";
if (source.includes(postResponseNeedle)) {
  replaceOnce(
    'monitor POST response messageMode',
    postResponseNeedle,
    "    template: cfg.template ?? DEFAULT_MONITOR_TEMPLATE,\n    messageMode: cfg.messageMode === 'custom' ? 'custom' : 'dynamic',\n    tenantId: cfg.tenantId ?? null,\n"
  );
}

if (changed) {
  fs.writeFileSync(serverPath, source, 'utf8');
  console.log('[patch] server.js atualizado com pipeline canônico + mensagens dinâmicas.');
} else {
  console.log('[patch] nenhuma alteração necessária; integração já aplicada.');
}
