'use strict';
// ===== Adapter Shopee (primeiro marketplace) =====
// Só DETECTA URLs da Shopee e prepara o ponto de geração do deeplink.
//
// Evidência real (painel Shopee Afiliados):
//  entrada: URL normal da Shopee
//  saída:   short link oficial no domínio https://s.shopee.com.br/...
//  O painel aceita Sub_id 1 até Sub_id 5 antes da geração.
//
// Regras desta etapa:
//  - NADA aqui fabrica o short link oficial; o `deeplinkGenerator` (API real,
//    injetado) é o único que devolve `affiliateUrl`. Sem ele → converted:false
//    e a URL original é PRESERVADA.
//  - `subIds` aceita até 5 valores opcionais (envio ao painel/generator).
//    `trackId` é mantido apenas como compat temporária e NÃO é parâmetro de URL.
//  - Sem scraping / browser automation: apenas parsing de URL.

const { createShopeeApiClient } = require('./shopeeApiClient');

const SHOPEE_HOST_REGEX =
  /(?:^|\.)shopee\.(?:com|com\.br|com\.mx|com\.ar|com\.co|co\.th|com\.sg|com\.my|com\.ph|id|vn|com\.tw|com\.in|com\.mm|es)\b$/i;
// Shortlinks reais usados pela Shopee, inclusive o formato brasileiro
// https://s.shopee.com.br/....
const SHOPEE_SHORTLINK_REGEX =
  /^(?:s\.shopee\.(?:com|com\.br|com\.mx|com\.ar|com\.co|co\.th|com\.sg|com\.my|com\.ph|id|vn|com\.tw|com\.in|com\.mm|es)|(?:[^.]+\.)?shp\.ee)$/i;

const MAX_SUB_IDS = 5;

function isShopeeUrl(url) {
  try {
    const withScheme = /^(?:https?|ftp):\/\//i.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(withScheme);
    return (
      SHOPEE_HOST_REGEX.test(hostname) || SHOPEE_SHORTLINK_REGEX.test(hostname)
    );
  } catch {
    return false;
  }
}

// Normaliza subIds da config: até 5 valores não vazios, em ordem.
function toSubIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, MAX_SUB_IDS);
}

function createShopeeConverter(options = {}) {
  const getConfig =
    typeof options.getConfig === 'function' ? options.getConfig : async () => ({});
  // Gerador padrão = Affiliate Open API real (ler credenciais do backend).
  // Exceção (credenciais ausentes/timeout/erros) é capturada no pipeline e a
  // URL original é preservada (fail-open). Testes podem injetar um falso.
  const deeplinkGenerator =
    typeof options.deeplinkGenerator === 'function'
      ? options.deeplinkGenerator
      : createShopeeApiClient().generateShortLink;

  return {
    marketplace: 'shopee',

    canHandle(url) {
      return isShopeeUrl(url);
    },

    async convert(url, ctx) {
      // Configuração por conta/cliente.
      let cfg = {};
      try {
        cfg = (await getConfig(ctx.sessionId)) || {};
      } catch {
        cfg = {};
      }
      const linkCfg = (cfg.linkConversion && cfg.linkConversion.shopee) || {};

      // subIds: Sub_id 1..5 (opcionais). Compat temporária: trackId legado vira
      // o primeiro sub_id quando subIds não foi informado.
      const subIds = toSubIds(linkCfg.subIds);
      const legacyTrackId =
        typeof linkCfg.trackId === 'string' ? linkCfg.trackId.trim() : '';
      const trackId = subIds.length > 0 ? null : legacyTrackId || null;
      const effectiveSubIds =
        subIds.length > 0 ? subIds : legacyTrackId ? [legacyTrackId] : [];

      if (!deeplinkGenerator) {
        return {
          sourceUrl: url,
          affiliateUrl: null,
          subIds: effectiveSubIds,
          marketplace: 'shopee',
          converted: false,
          trackId,
          reason: 'gerador de deeplink ainda não disponível',
        };
      }

      // Ponto único de integração futura com a API oficial de afiliado.
      const generated = await deeplinkGenerator({
        sourceUrl: url,
        subIds: effectiveSubIds,
        trackId,
      });

      if (
        !generated ||
        typeof generated.affiliateUrl !== 'string' ||
        !generated.affiliateUrl
      ) {
        return {
          sourceUrl: url,
          affiliateUrl: null,
          subIds: effectiveSubIds,
          marketplace: 'shopee',
          converted: false,
          trackId,
          error: 'gerador não devolveu affiliateUrl',
        };
      }

      return {
        sourceUrl: url,
        affiliateUrl: generated.affiliateUrl,
        subIds: effectiveSubIds,
        marketplace: 'shopee',
        converted: true,
        trackId,
      };
    },
  };
}

module.exports = { createShopeeConverter, isShopeeUrl };
