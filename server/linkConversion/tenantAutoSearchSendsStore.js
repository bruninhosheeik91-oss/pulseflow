'use strict';
// ===== Registro de envios manuais da Busca Automática (por tenant) =====
//
// Persiste SOMENTE o resultado de envios manuais reais. Nunca armazena
// segredo/App Secret, tokens ou conteúdo além do conjunto definido pelo
// contrato ({ automationId, tenantId, sessionId, groupId, itemId,
// marketplace, affiliateUrl, sentAt, status, messageId, error }).
//
// Persistência: server/data/sends/<tenantId>.json

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const path = require('path');

const TENANT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;
const MAX_RECORDS = 50;

function str(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function maxLength(value, length) {
  if (typeof value !== 'string') return value;
  return value.slice(0, length);
}

// Sanitiza um registro de envio. Aceita parseado ou texto.
function normalizeSendRecord(input = {}) {
  const raw = input && typeof input === 'object' ? input : {};

  const status = raw.status === 'failed' ? 'failed' : 'sent';
  const sentAt =
    typeof raw.sentAt === 'string' && raw.sentAt ? raw.sentAt : new Date().toISOString();
  const itemId = Number(raw.itemId);
  let normalizedItemId = null;
  if (Number.isFinite(itemId) && itemId >= 0) normalizedItemId = itemId;

  return {
    tenantId: str(raw.tenantId, ''),
    automationId: str(raw.automationId, ''),
    sessionId: str(raw.sessionId, ''),
    groupId: str(raw.groupId, ''),
    itemId: normalizedItemId,
    marketplace: raw.marketplace === 'Shopee' ? 'Shopee' : str(raw.marketplace, 'Shopee'),
    affiliateUrl: str(raw.affiliateUrl, ''),
    productName: maxLength(str(raw.productName, ''), 200),
    sentAt,
    status,
    messageId: raw.messageId == null ? null : maxLength(str(raw.messageId, ''), 200) || null,
    error: raw.error == null ? null : maxLength(str(raw.error, ''), 300) || null,
  };
}

function createTenantAutoSearchSendsStore({ dataDir }) {
  const baseDir = path.join(dataDir, 'sends');

  function fileFor(tenantId) {
    return path.join(baseDir, `${tenantId}.json`);
  }

  function list(tenantId) {
    if (!TENANT_ID_PATTERN.test(String(tenantId || ''))) return [];
    try {
      if (!existsSync(fileFor(tenantId))) return [];
      const parsed = JSON.parse(readFileSync(fileFor(tenantId), 'utf8'));
      if (!Array.isArray(parsed.sends)) return [];
      return parsed.sends
        .map(normalizeSendRecord)
        .filter((entry) => entry && entry.status)
        .slice(0, MAX_RECORDS);
    } catch (err) {
      console.error(
        `[error] ${new Date().toISOString()} falha ao ler envios (${String(
          tenantId
        )}): ${String((err && err.message) || err)}`
      );
      return [];
    }
  }

  function record(tenantId, entry) {
    if (!TENANT_ID_PATTERN.test(String(tenantId || ''))) return null;
    let records = list(tenantId);
    const normalized = normalizeSendRecord({ ...(entry || {}), tenantId });
    normalized.sentAt = new Date().toISOString();
    records = [normalized, ...records].slice(0, MAX_RECORDS);
    try {
      if (!existsSync(baseDir)) {
        mkdirSync(baseDir, { recursive: true });
      }
      writeFileSync(fileFor(tenantId), JSON.stringify({ sends: records }, null, 2));
    } catch (err) {
      console.error(
        `[error] ${new Date().toISOString()} falha ao persistir envio (${String(
          tenantId
        )}): ${String((err && err.message) || err)}`
      );
    }
    return normalized;
  }

  return { list, record };
}

module.exports = {
  createTenantAutoSearchSendsStore,
  normalizeSendRecord,
};