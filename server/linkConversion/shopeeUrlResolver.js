'use strict';

const SHOPEE_SHORT_HOST_REGEX = /^(?:s\.shopee\.(?:com|com\.br|com\.mx|com\.ar|com\.co|co\.th|com\.sg|com\.my|com\.ph|id|vn|com\.tw|com\.in|com\.mm|es)|(?:[^.]+\.)?shp\.ee)$/i;

function isShopeeShortUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return SHOPEE_SHORT_HOST_REGEX.test(parsed.hostname);
  } catch {
    return false;
  }
}

async function resolveShopeeProductUrl(rawUrl, options = {}) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
  const sourceUrl = rawUrl.trim();
  if (!isShopeeShortUrl(sourceUrl)) return sourceUrl;

  const fetchImpl = typeof options.fetchImpl === 'function' ? options.fetchImpl : fetch;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 12000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      },
    });

    const finalUrl =
      response && typeof response.url === 'string' ? response.url.trim() : '';
    return finalUrl || sourceUrl;
  } catch {
    return sourceUrl;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  isShopeeShortUrl,
  resolveShopeeProductUrl,
};
