'use strict';
// =============================================================================
//  PATCH DE BUILD — Pin do WhatsApp Web v2.3.3 (WPPConnect 2.3.3)
// -----------------------------------------------------------------------------
//  PROBLEMA
//  ~~~~~~~~
//  `browser.js` (dist/controllers) intercepta o request do documento e pina o
//  HTML apenas quando a URL é EXATAMENTE 'https://web.whatsapp.com/' (string
//  com barra final; ver linha 114 do dist instalado: `req.url() !==
//  'https://web.whatsapp.com/'`). Quando o WhatsApp Web faz uma navegação com
//  query string (ex.: retry de sessão / Session Unpaired / re-pareamento de QR
//  que usam `https://web.whatsapp.com/?x=1`), o interceptor NÃO casa — o
//  request é `continue()`-ado e a build LIVE carrega, perdendo o pin da versão
//  configurada (`whatsappVersion: '2.3000.1047296119-alpha'`); o runtime passa a
//  reportar a build live (ex.: `2.3000.1047871790`).
//
//  CORREÇÃO (menor possível, sem tocar em wa-js/wa-version/wppconnect fora do
//  interceptor e sem mudar nenhuma versão/dependência): o interceptor passa a
//  responder o documento principal pinado para QUALQUER navegação do documento
//  do frame principal cuja URL seja origin `https://web.whatsapp.com` com
//  pathname `/` — aceitando query string — em vez de exigir string exata.
//
//  Lógica substituída (predicado canônico — a mesma usada no teste):
//      const u = new URL(req.url());
//      const isMainNavigation = req.isNavigationRequest() && req.frame() === page.mainFrame();
//      if (u.origin === 'https://web.whatsapp.com' && u.pathname === '/' && isMainNavigation) {
//        req.respond({ status: 200, contentType: 'text/html', body: body });
//        return;
//      }
//      req.continue();
//
//  do que NÃO intercepta: /check-update (abort, mantido), /send, /app, assets,
//  requests não-navigation, frames internos.
//
//  SEGURANÇA/HARDCORE:
//    * IDEMPOTENTE: marca no topo do arquivo; aplicar 2x não corrompe nem
//      duplica.
//    * VALIDA ASSINATURA EXATA do WPPConnect 2.3.3 instalado ANTES de trocar;
//      se a estrutura esperada NÃO existir, o script FALHA (exit != 0) → o
//      Docker build aborta → NUNCA publica sem o patch.
//    * Chaveado por contagem única do bloco antigo (ocorrências === 1).
//
//  USO (Docker build — após `COPY . .`):
//      RUN node scripts/patch-wppconnect-version-interceptor.js
// =============================================================================
const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'node_modules',
  '@wppconnect-team',
  'wppconnect',
  'dist',
  'controllers',
  'browser.js'
);

const MARKER = '/* domnex-pin-whatsapp-version:applied */';

// Bloco antigo exato do dist 2.3.3 (linhas 108-123). Mantido fiel ao arquivo
// instalado (verificado com Select-String: `req.url() !== 'https://web.whatsapp.com/'`).
const OLD_BLOCK = [
  "        if (req.url().startsWith('https://web.whatsapp.com/check-update')) {",
  '            req.abort();',
  '            return;',
  '        }',
  "        if (req.url() !== 'https://web.whatsapp.com/') {",
  '            req.continue();',
  '            return;',
  '        }',
  '        req.respond({',
  '            status: 200,',
  "            contentType: 'text/html',",
  '            body: body,',
  '        });',
].join('\n');

const NEW_BLOCK = [
  "        if (req.url().startsWith('https://web.whatsapp.com/check-update')) {",
  '            req.abort();',
  '            return;',
  '        }',
  '        const u_pin_wpp = new URL(req.url());',
  '        const isMainNav_wpp = req.isNavigationRequest() && req.frame() === page.mainFrame();',
  '        if (u_pin_wpp.origin === "https://web.whatsapp.com" && u_pin_wpp.pathname === "/" && isMainNav_wpp) {',
  '            req.respond({',
  '                status: 200,',
  "                contentType: 'text/html',",
  '                body: body,',
  '            });',
  '            return;',
  '        }',
  '        req.continue();',
].join('\n');

/**
 * Aplica o patch de forma idempotente após validar a assinatura exata do
 * dist do WPPConnect 2.3.3. Retorna {ok, message, ...}.
 */
function applyPatch({ dryRun = false, target = TARGET } = {}) {
  let src;
  try {
    src = fs.readFileSync(target, 'utf8');
  } catch (e) {
    return { ok: false, message: `não consegui ler ${target}: ${e.message}` };
  }

  // Já aplicado?
  if (src.includes(MARKER)) {
    return { ok: true, alreadyApplied: true, message: 'patch já aplicado (idempotente; nada a fazer)' };
  }

  // Validação de assinatura: o bloco antigo deve existir exatamente 1x.
  const occurrences = src.split(OLD_BLOCK).length - 1;
  if (occurrences !== 1) {
    return {
      ok: false,
      message:
        `assinatura inesperada: esperava o interceptor do dist 2.3.3 exatamente ` +
        `1x no arquivo, encontrei ${occurrences}. NÃO apliquei para não corromper. ` +
        `Verifique se o pacote @wppconnect-team/wppconnect está na versão 2.3.3.`,
    };
  }

  const patched = src.replace(OLD_BLOCK, NEW_BLOCK + '\n' + MARKER);

  if (dryRun) {
    return { ok: true, dryRun: true, message: 'dry-run OK: assinatura válida; patch seria aplicado' };
  }

  try {
    fs.writeFileSync(target, patched, 'utf8');
  } catch (e) {
    return { ok: false, message: `falha ao gravar ${target}: ${e.message}` };
  }
  return { ok: true, applied: true, message: 'patch aplicado com sucesso' };
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  const res = applyPatch({ dryRun });
  if (res.ok) {
    console.log(`[patch-wppconnect-version-interceptor] ${res.message}`);
    if (res.applied || res.alreadyApplied) {
      // banda: se já aplicado anteriormente e este build apenas relança, ok.
    }
    process.exit(0);
  }
  console.error(`[patch-wppconnect-version-interceptor] ${res.message}`);
  process.exit(1);
}

module.exports = { applyPatch, TARGET, OLD_BLOCK, NEW_BLOCK, MARKER };
