'use strict';

const { randomUUID } = require('node:crypto');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const TENANT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;
const DESTINATIONS = new Set(['manual', 'campaign', 'queue']);
const ROTATIONS = new Set(['sequential', 'deal_score', 'discount', 'random']);

function str(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
function num(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
function normalizeFrequency(raw = {}, previous = {}) {
  return {
    minIntervalMinutes: num(raw.minIntervalMinutes, previous.minIntervalMinutes ?? 30, 1, 10080),
    maxPerHour: num(raw.maxPerHour, previous.maxPerHour ?? 6, 1, 1000),
    maxPerDay: num(raw.maxPerDay, previous.maxPerDay ?? 100, 1, 10000),
    windowStart: str(raw.windowStart, previous.windowStart || '08:00'),
    windowEnd: str(raw.windowEnd, previous.windowEnd || '23:00'),
    activeDays: Array.isArray(raw.activeDays)
      ? raw.activeDays.filter((d) => typeof d === 'string' && d.trim()).slice(0, 7)
      : Array.isArray(previous.activeDays) ? previous.activeDays.slice(0, 7) : [],
  };
}
function normalizeItem(input = {}, previous = null) {
  const now = new Date().toISOString();
  return {
    id: str(input.id, previous?.id) || randomUUID(),
    url: str(input.url, previous?.url).slice(0, 2048),
    marketplace: input.marketplace ?? previous?.marketplace ?? null,
    productName: input.productName ?? previous?.productName ?? null,
    affiliateUrl: input.affiliateUrl ?? previous?.affiliateUrl ?? null,
    processError: input.processError ?? previous?.processError ?? null,
    processedAt: input.processedAt ?? previous?.processedAt ?? null,
    status: str(input.status, previous?.status || 'Pendente'),
    campaignId: input.campaignId ?? previous?.campaignId ?? null,
    campaignName: input.campaignName ?? previous?.campaignName ?? null,
    addedAt: previous?.addedAt || input.addedAt || now,
    automationSource: 'LINK_LIST',
  };
}
function normalizeList(input = {}, existing = null) {
  const now = new Date().toISOString();
  const destination = DESTINATIONS.has(input.destination)
    ? input.destination
    : DESTINATIONS.has(existing?.destination) ? existing.destination : 'manual';
  const rotation = ROTATIONS.has(input.rotation)
    ? input.rotation
    : ROTATIONS.has(existing?.rotation) ? existing.rotation : 'sequential';
  return {
    id: str(input.id, existing?.id) || randomUUID(),
    name: str(input.name, existing?.name || 'Nova lista').slice(0, 120),
    description: str(input.description, existing?.description || '').slice(0, 500),
    campaignId: input.campaignId ?? existing?.campaignId ?? null,
    campaignName: input.campaignName ?? existing?.campaignName ?? null,
    destination,
    rotation,
    frequency: normalizeFrequency(input.frequency || {}, existing?.frequency || {}),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    links: Array.isArray(input.links)
      ? input.links.map((item) => normalizeItem(item)).filter((item) => item.url)
      : Array.isArray(existing?.links) ? existing.links.map((item) => normalizeItem(item, item)) : [],
    automationSource: 'LINK_LIST',
  };
}
function createTenantLinkListsStore(options = {}) {
  const dataDir = options.dataDir || path.join(__dirname, '..', 'data');
  const dir = path.join(dataDir, 'link-lists');
  const fileFor = (tenantId) => TENANT_ID_PATTERN.test(String(tenantId || ''))
    ? path.join(dir, `${tenantId}.json`) : null;
  const readAll = (tenantId) => {
    const file = fileFor(tenantId);
    if (!file || !existsSync(file)) return [];
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      return (Array.isArray(parsed.lists) ? parsed.lists : []).map((list) => normalizeList(list, list));
    } catch { return []; }
  };
  const writeAll = (tenantId, lists) => {
    const file = fileFor(tenantId);
    if (!file) return false;
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify({ tenant: tenantId, lists }, null, 2));
    return true;
  };
  const list = (tenantId) => readAll(tenantId).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const get = (tenantId, id) => readAll(tenantId).find((item) => item.id === id) || null;
  const upsert = (tenantId, input) => {
    const records = readAll(tenantId);
    const id = str(input?.id);
    const index = id ? records.findIndex((item) => item.id === id) : -1;
    const next = normalizeList(input, index >= 0 ? records[index] : null);
    if (index >= 0) records[index] = next; else records.push(next);
    writeAll(tenantId, records);
    return next;
  };
  const remove = (tenantId, id) => {
    const records = readAll(tenantId);
    const next = records.filter((item) => item.id !== id);
    if (next.length === records.length) return false;
    writeAll(tenantId, next);
    return true;
  };
  const addLinks = (tenantId, id, urls) => {
    const records = readAll(tenantId);
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const clean = Array.from(new Set((Array.isArray(urls) ? urls : [])
      .filter((url) => typeof url === 'string' && /^https?:\/\//i.test(url.trim()))
      .map((url) => url.trim().slice(0, 2048)))).slice(0, 500);
    const existingUrls = new Set(records[index].links.map((item) => item.url));
    const added = clean.filter((url) => !existingUrls.has(url)).map((url) => normalizeItem({ url }));
    records[index] = { ...records[index], links: [...added, ...records[index].links], updatedAt: new Date().toISOString() };
    writeAll(tenantId, records);
    return { list: records[index], added };
  };
  const removeLink = (tenantId, id, linkId) => {
    const records = readAll(tenantId);
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const before = records[index].links.length;
    records[index] = { ...records[index], links: records[index].links.filter((item) => item.id !== linkId), updatedAt: new Date().toISOString() };
    if (before === records[index].links.length) return false;
    writeAll(tenantId, records);
    return records[index];
  };
  const updateLink = (tenantId, id, linkId, patch) => {
    const records = readAll(tenantId);
    const listIndex = records.findIndex((item) => item.id === id);
    if (listIndex < 0) return null;
    const linkIndex = records[listIndex].links.findIndex((item) => item.id === linkId);
    if (linkIndex < 0) return false;
    records[listIndex].links[linkIndex] = normalizeItem(
      { ...records[listIndex].links[linkIndex], ...(patch || {}) },
      records[listIndex].links[linkIndex]
    );
    records[listIndex].updatedAt = new Date().toISOString();
    writeAll(tenantId, records);
    return records[listIndex].links[linkIndex];
  };
  return { list, get, upsert, remove, addLinks, removeLink, updateLink };
}
module.exports = { createTenantLinkListsStore, normalizeList };
