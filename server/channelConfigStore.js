'use strict';

const path = require('path');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');

function createChannelConfigStore({ dataDir }) {
  const filePath = path.join(dataDir, 'channel-config.json');
  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      if (existsSync(filePath)) {
        const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
        cache = parsed && typeof parsed === 'object' ? parsed : {};
      } else {
        cache = {};
      }
    } catch {
      cache = {};
    }
    return cache;
  }

  function persist() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(load(), null, 2));
  }

  function key(sessionId, groupId) {
    return `${sessionId}::${groupId}`;
  }

  function normalize(input = {}) {
    const enabled = input.enabled !== false;
    const antiFloodDelay = Number.isFinite(Number(input.antiFloodDelay))
      ? Math.min(3600, Math.max(0, Number(input.antiFloodDelay)))
      : 30;
    const campaignIds = Array.isArray(input.campaignIds)
      ? Array.from(new Set(input.campaignIds.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())))
      : [];
    return { enabled, antiFloodDelay, campaignIds };
  }

  return {
    list() {
      return load();
    },
    get(sessionId, groupId) {
      return normalize(load()[key(sessionId, groupId)] || {});
    },
    set(sessionId, groupId, next) {
      const value = normalize(next);
      const record = {
        ...value,
        sessionId,
        groupId,
        updatedAt: new Date().toISOString(),
      };
      load()[key(sessionId, groupId)] = record;
      persist();
      return record;
    },
  };
}

module.exports = { createChannelConfigStore };
