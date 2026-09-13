'use strict';
// ===== AffiliateLinkConverter — núcleo do pipeline =====
// Transforma apenas URLs de marketplace com adapter registrado em links de
// afiliado, preservando todo o restante da mensagem.
//
// Garantias:
//  - A fachada `convertText` NUNCA lança exceção: se algo falhar, devolve o
//    texto original intacto. O monitor nunca pode falhar por causa do converter.
//  - Só substitui URLs de marketplaces reconhecidos; links comuns e o texto
//    ao redor (emojis, quebras de linha, pontuação) são preservados byte a byte.
//  - Não inventa formato de link afiliado: a geração do deeplink fica no
//    adapter de cada marketplace (Shopee primeiro), que hoje apenas detecta a
//    URL e aguarda o método real de geração.

const { createShopeeConverter } = require('./shopeeConverter');

// Captura URLs com ou sem esquema. O grupo final evita conter `)` sozinho
// (fecha texto casual) mas mantém query/parâmetros típicos de produto.
const URL_MATCH_REGEX =
  /(?:(?:https?|ftp):\/\/)?(?:www\.)*[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_+.~#?&/=!;()]*[-a-zA-Z0-9@:%_+~#?&/=!;])?/gi;

// Pontuação final que quase sempre NÃO pertence à URL (mantida no texto).
function cleanRawUrl(raw) {
  let url = String(raw).trim();
  url = url.replace(/[.,;:!?'"]+$/, '');
  if (/\)$/.test(url) && !/\(/.test(url)) url = url.slice(0, -1);
  return url;
}

// Extrai URLs únicas preservando ordem de aparição.
// Retorna [{ raw, url }]: `raw` é o trecho EXATO na mensagem (para substituição
// cirúrgica), `url` é a versão limpa usada na detecção/conversão.
function extractUrls(text) {
  const matches = String(text).match(URL_MATCH_REGEX) || [];
  const seen = new Set();
  const result = [];
  for (const raw of matches) {
    const url = cleanRawUrl(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push({ raw, url });
  }
  return result;
}

// Substitui apenas os trechos exatos das URLs convertidas, devolvendo ao texto
// a pontuação que foi removida na limpeza (ex.: ponto final após a URL).
function replaceConverted(text, conversions) {
  let out = text;
  for (const c of conversions) {
    if (!c.converted || !c.affiliateUrl) continue;
    const suffix = c.raw.slice(c.url.length) || '';
    out = out.split(c.raw).join(c.affiliateUrl + suffix);
  }
  return out;
}

function createAffiliateLinkConverter(options = {}) {
  const getConfig =
    typeof options.getConfig === 'function' ? options.getConfig : async () => ({});

  const adapters = [
    createShopeeConverter({
      getConfig,
      deeplinkGenerator: options.shopeeDeeplinkGenerator,
    }),
  ];

  async function isConversionEnabled(sessionId) {
    try {
      const cfg = (await getConfig(sessionId)) || {};
      const conv = cfg.linkConversion || {};
      return conv.enabled !== false;
    } catch {
      return true; // falha de config NUNCA bloqueia envio
    }
  }

  // Converte uma URL com o primeiro adapter que a reconhecer. Exceção do
  // adapter não propaga: mantém a URL original e segue o pipeline.
  async function convertUrl(url, ctx) {
    for (const adapter of adapters) {
      if (!adapter.canHandle(url)) continue;
      if (!(await isConversionEnabled(ctx.sessionId))) {
        return {
          url,
          raw: ctx.raw,
          sourceUrl: url,
          affiliateUrl: null,
          subIds: [],
          marketplace: adapter.marketplace,
          converted: false,
          reason: 'conversão desativada na configuração',
        };
      }
      try {
        const res = await adapter.convert(url, {
          sessionId: ctx.sessionId,
          raw: ctx.raw,
        });
        return { ...res, raw: ctx.raw, url };
      } catch (err) {
        return {
          url,
          raw: ctx.raw,
          sourceUrl: url,
          affiliateUrl: null,
          subIds: [],
          marketplace: adapter.marketplace,
          converted: false,
          error: String((err && err.message) || err),
        };
      }
    }
    return {
      url,
      raw: ctx.raw,
      sourceUrl: url,
      affiliateUrl: null,
      subIds: [],
      marketplace: null,
      converted: false,
    };
  }

  async function convertText(sessionId, text) {
    const original = String(text == null ? '' : text);
    const urls = extractUrls(original);
    if (!urls.length) {
      return { text: original, converted: 0, conversions: [] };
    }
    const conversions = [];
    for (const entry of urls) {
      conversions.push(await convertUrl(entry.url, { sessionId, raw: entry.raw }));
    }
    const converted = conversions.filter(
      (c) => c.converted && c.affiliateUrl
    ).length;
    return {
      text: replaceConverted(original, conversions),
      converted,
      conversions,
    };
  }

  // Fachada à prova de falhas: nunca rejeita, nunca altera o texto em erros.
  async function safeConvertText(sessionId, text) {
    try {
      return await convertText(sessionId, text);
    } catch {
      return {
        text: String(text == null ? '' : text),
        converted: 0,
        conversions: [],
      };
    }
  }

  return {
    marketplaces: adapters.map((a) => a.marketplace),
    convertText: safeConvertText,
    convertUrl,
    extractUrls,
  };
}

module.exports = { createAffiliateLinkConverter, extractUrls, cleanRawUrl, replaceConverted };