'use strict';

const NEWSLETTER_ID_REGEX = /^[^\s@]+@newsletter$/i;

function serializedId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value !== 'object') return null;

  const candidates = [
    value._serialized,
    value.serialized,
    value.remote,
    value.remoteJid,
    value.id,
    value.user && value.server ? `${value.user}@${value.server}` : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

function normalizeNewsletter(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const idCandidates = [
    raw.id,
    raw.chatId,
    raw.wid,
    raw.remoteJid,
    raw.newsletterId,
    raw.key && raw.key.remoteJid,
  ];

  let id = null;
  for (const candidate of idCandidates) {
    const normalized = serializedId(candidate);
    if (normalized && NEWSLETTER_ID_REGEX.test(normalized)) {
      id = normalized;
      break;
    }
  }
  if (!id) return null;

  const nameCandidates = [
    raw.name,
    raw.formattedTitle,
    raw.title,
    raw.pushname,
    raw.displayName,
    raw.newsletterName,
  ];
  const name =
    nameCandidates.find((value) => typeof value === 'string' && value.trim())?.trim() ||
    id;

  const descriptionCandidates = [raw.description, raw.about, raw.desc];
  const description =
    descriptionCandidates.find((value) => typeof value === 'string' && value.trim())?.trim() ||
    null;

  return {
    id,
    name,
    description,
    type: 'newsletter',
    isNewsletter: true,
  };
}

async function listNewslettersForClient(sessionClient) {
  if (!sessionClient) return [];

  let source = [];

  // WPPConnect 2.x expõe newsletters pelo listChats({ onlyNewsletter: true }).
  if (typeof sessionClient.listChats === 'function') {
    try {
      source = (await sessionClient.listChats({ onlyNewsletter: true })) || [];
    } catch {
      source = [];
    }
  }

  // Fallback: algumas builds retornam newsletters junto de getAllChats/listChats.
  if (!Array.isArray(source) || source.length === 0) {
    try {
      if (typeof sessionClient.getAllChats === 'function') {
        source = (await sessionClient.getAllChats()) || [];
      } else if (typeof sessionClient.listChats === 'function') {
        source = (await sessionClient.listChats()) || [];
      }
    } catch {
      source = [];
    }
  }

  const unique = new Map();
  for (const raw of Array.isArray(source) ? source : []) {
    const newsletter = normalizeNewsletter(raw);
    if (!newsletter) continue;
    if (!unique.has(newsletter.id)) unique.set(newsletter.id, newsletter);
  }

  return [...unique.values()].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
  );
}

function isNewsletterId(value) {
  return typeof value === 'string' && NEWSLETTER_ID_REGEX.test(value.trim());
}

module.exports = {
  NEWSLETTER_ID_REGEX,
  isNewsletterId,
  normalizeNewsletter,
  listNewslettersForClient,
};
