'use strict';
// ===== Persistência das automações da Busca Automática (multi-tenant) =====
//
// Cada tenant mantém as PRÓPRIAS automações em
//   server/data/automations/<tenantId>.json
//
// Sem mocks: grupos/destinos vêm das contas WhatsApp reais no momento do
// carregamento; aqui só se guarda a referência escolhida pelo usuário.
// O nome de arquivo é validado contra o mesmo padrão de sessionId/tenantId.

const { randomUUID } = require('node:crypto');
const {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} = require('node:fs');
const path = require('node:path');

const TENANT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

const PRIORITY_OPTIONS = [
  'desconto',
  'comissao',
  'vendas',
  'avaliacao',
  'variedade',
];

function toNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function str(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

// Normaliza o payload recebido em um registro seguro e consistente.
function normalizeAutomation(input = {}, existing = null) {
  const now = new Date().toISOString();
  const raw = input && typeof input === 'object' ? input : {};
  const previous =
    existing && typeof existing === 'object' ? existing : {};

  const dest = raw.destination || previous.destination || {};
  const schedule = raw.schedule || previous.schedule || {};
  const categories = raw.categories || previous.categories || {};
  const filters = raw.filters || previous.filters || {};

  const priority = PRIORITY_OPTIONS.includes(raw.priority)
    ? raw.priority
    : PRIORITY_OPTIONS.includes(previous.priority)
    ? previous.priority
    : 'desconto';

  const scheduleInterval = clamp(
    Math.floor(toNumber(schedule.intervalMinutes, 60) || 60),
    1,
    10080
  );

  return {
    id: str(raw.id, previous.id) || randomUUID(),
    name: str(
      raw.name,
      str(previous.name, 'Nova automação')
    ).slice(0, 120),
    marketplace: 'Shopee',
    active: raw.active === true || (raw.active === undefined && previous.active === true),
    destination: {
      accountId: str(dest.accountId, previous.destination?.accountId || ''),
      groupIds: Array.isArray(dest.groupIds)
        ? dest.groupIds.filter((g) => typeof g === 'string' && g.trim()).slice(0, 500)
        : Array.isArray(previous.destination?.groupIds)
        ? previous.destination.groupIds.slice(0, 500)
        : [],
    },
    schedule: {
      startDate: str(schedule.startDate, previous.schedule?.startDate || ''),
      endDate: str(schedule.endDate, previous.schedule?.endDate || ''),
      timeStart: str(schedule.timeStart, previous.schedule?.timeStart || '09:00'),
      timeEnd: str(schedule.timeEnd, previous.schedule?.timeEnd || '18:00'),
      intervalMinutes: scheduleInterval,
    },
    categories: {
      general: categories.general !== false,
      categoryId: toNumber(categories.categoryId, previous.categories?.categoryId ?? null),
    },
    filters: {
      minPrice: toNumber(filters.minPrice, previous.filters?.minPrice ?? null),
      maxPrice: toNumber(filters.maxPrice, previous.filters?.maxPrice ?? null),
      minDiscount: toNumber(filters.minDiscount, previous.filters?.minDiscount ?? null),
      minCommission: toNumber(filters.minCommission, previous.filters?.minCommission ?? null),
      minSales: toNumber(filters.minSales, previous.filters?.minSales ?? null),
      minRating: toNumber(filters.minRating, previous.filters?.minRating ?? null),
    },
    maxResults: clamp(
      Math.floor(toNumber(raw.maxResults, previous.maxResults ?? 5) || 5),
      1,
      5
    ),
    priority,
    messageTemplate: str(
      raw.messageTemplate,
      str(
        previous.messageTemplate,
        'OFERTA! {{produto}}\nDe R$ {{preco_original}} por R$ {{preco}}\n{{desconto}}% OFF\nLink: {{link}}'
      )
    ).slice(0, 2000),
    createdAt: previous.createdAt || now,
    updatedAt: now,
  };
}

function readFileSafe(filePath, fallback) {
  try {
    if (!existsSync(filePath)) return fallback;
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function createTenantAutomationsStore(options = {}) {
  const dataDir = options.dataDir || path.join(__dirname, '..', 'data');
  const automationsDir = path.join(dataDir, 'automations');

  function fileFor(tenantId) {
    if (!TENANT_ID_PATTERN.test(String(tenantId || ''))) return null;
    return path.join(automationsDir, `${String(tenantId)}.json`);
  }

  function readAll(tenantId) {
    const file = fileFor(tenantId);
    if (!file) return [];
    const data = readFileSafe(file, {});
    const records = Array.isArray(data.automations) ? data.automations : [];
    return records.map((record) => normalizeAutomation(record, record)).filter(Boolean);
  }

  function writeAll(tenantId, records) {
    const file = fileFor(tenantId);
    if (!file) return false;
    if (!existsSync(automationsDir)) {
      mkdirSync(automationsDir, { recursive: true });
    }
    writeFileSync(file, JSON.stringify({ tenant: tenantId, automations: records }, null, 2));
    return true;
  }

  function list(tenantId) {
    return readAll(tenantId).sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'pt-BR')
    );
  }

  function get(tenantId, id) {
    return readAll(tenantId).find((record) => record.id === id) || null;
  }

  function upsert(tenantId, input) {
    const id = str(input && input.id);
    const records = readAll(tenantId);
    const index = id ? records.findIndex((record) => record.id === id) : -1;
    const existing = index >= 0 ? records[index] : null;
    const next = normalizeAutomation(input, existing);
    if (index >= 0) {
      records[index] = next;
    } else {
      records.push(next);
    }
    writeAll(tenantId, records);
    return next;
  }

  function remove(tenantId, id) {
    const records = readAll(tenantId);
    const next = records.filter((record) => record.id !== id);
    if (next.length === records.length) return false;
    writeAll(tenantId, next);
    return true;
  }

  return { list, get, upsert, remove };
}

module.exports = {
  createTenantAutomationsStore,
  normalizeAutomation,
};