'use strict';
// TESTE REAL (uma chamada) — Affiliate Open API da Shopee.
// NÃO integra ao monitor. NÃO persiste nada. NÃO envia WhatsApp.
//
// Uso:      node linkConversion/test-real-shopee.js [sourceUrl]
// Exemplo:  node linkConversion/test-real-shopee.js "https://shopee.com.br/item/123456"
//
// Credenciais: somente do BACKEND.
//   1) variáveis de ambiente do processo (onde o backend roda);
//   2) arquivo server/.env (gitignored, KEY=VAL) caso exista.
// Nunca lê de arquivos versionados nem recebe credencial por parâmetro.
//
// Exibe SOMENTE: sourceUrl, affiliateUrl, converted, erro sanitizado.
// Nunca exibe: Secret, Authorization, assinatura, AppId ou payload assinado.

const fs = require('node:fs');
const path = require('node:path');
const { createShopeeApiClient } = require('./shopeeApiClient.js');

// --- credenciais exclusivamente do backend ---
const env = { ...process.env };
const envFilePath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFilePath)) {
  for (const line of fs.readFileSync(envFilePath, 'utf8').split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key && !(key in env)) env[key] = val;
  }
}

// Endpoint BR é o padrão do client; API_URL sobrescreve se estiver no env.
const sourceUrl =
  process.argv[2] || 'https://shopee.com.br/item/998877?sp_atk=teste';

(async () => {
  const client = createShopeeApiClient({ env });
  let affiliateUrl = null;
  let converted = false;
  let error = null;

  try {
    const result = await client.generateShortLink({
      sourceUrl,
      subIds: ['PULSETESTE'],
    });
    affiliateUrl = result.affiliateUrl;
    converted = true;
  } catch (err) {
    error = (err && err.message) || String(err);
  }

  console.log('sourceUrl   :', sourceUrl);
  console.log('affiliateUrl:', affiliateUrl || 'n/a');
  console.log('converted   :', converted);
  if (error) {
    console.log('error       :', error); // mensagens do client já são sanitizadas
  }

  if (converted && affiliateUrl) {
    let host = 'n/a';
    try {
      host = new URL(affiliateUrl).hostname;
    } catch {
      host = 'n/a';
    }
    const official =
      /(?:^|\.)s\.shopee\.com\.br$/i.test(host) ||
      /(?:^|\.)shopee\.com\.br$/i.test(host);
    console.log('dominio     :', host, '| oficial shopee:', official);
  } else {
    console.log('dominio     : n/a (sem short link)');
  }
})();