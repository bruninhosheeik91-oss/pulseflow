'use strict';
// Testes do patch de pin do WhatsApp Web (scripts/patch-wppconnect-version-interceptor.js).
// Cobre a lógica pura (transformação OLD_BLOCK -> NEW_BLOCK, assinatura, idempotência,
// dry-run) em diretório temporário — sem tocar no node_modules real — e, se o dist
// 2.3.3 estiver instalado, valida também o artefato final do build.
// Execução:  node linkConversion/tests/versionInterceptorPatch.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  applyPatch,
  OLD_BLOCK,
  NEW_BLOCK,
  MARKER,
  TARGET,
} = require('../../scripts/patch-wppconnect-version-interceptor.js');

let passed = 0;
const failures = [];

async function run(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (err) {
    failures.push({ name, err });
    console.error(`  FAIL  ${name}\n        ${err.message}`);
  }
}

// Monta um dist sintético: bloco antigo exato + contexto de entorno para o teste
// detectar corrupção (ex.: substituição duplicada, quebra de sintaxe).
function makeFakeDist(occurrences) {
  const header = [
    '// topo do arquivo',
    "const { waVersion } = require('@wppconnect-team/wa-version');",
    'async function setWhatsappVersion(page, version, log) {',
    '    // ... antes do interceptor',
    '    await page.setRequestInterception(true);',
    '    page.on(\'request\', (req) => {',
  ].join('\n');
  const body = Array.from({ length: occurrences }, () => OLD_BLOCK).join('\n');
  const footer = [
    '    });',
    '}',
    '// fim do arquivo',
  ].join('\n');
  return [header, body, footer].join('\n');
}

function tmpFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-pin-test-'));
  const file = path.join(dir, 'browser.js');
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

(async () => {
  console.log('\n== Contrato dos blocos (fiel ao dist 2.3.3) ==');

  await run('OLD_BLOCK contém o match exato antigo da barra final', () => {
    assert.ok(OLD_BLOCK.includes("if (req.url() !== 'https://web.whatsapp.com/') {"));
    assert.ok(OLD_BLOCK.includes("req.url().startsWith('https://web.whatsapp.com/check-update')"));
    assert.ok(!OLD_BLOCK.includes('isNavigationRequest'));
  });

  await run('NEW_BLOCK pin por origin+pathname e só na navegação principal', () => {
    assert.ok(NEW_BLOCK.includes('const u_pin_wpp = new URL(req.url());'));
    assert.ok(NEW_BLOCK.includes('const isMainNav_wpp = req.isNavigationRequest() && req.frame() === page.mainFrame();'));
    assert.ok(NEW_BLOCK.includes('u_pin_wpp.origin === "https://web.whatsapp.com" && u_pin_wpp.pathname === "/" && isMainNav_wpp'));
    assert.ok(!NEW_BLOCK.includes("req.url() !== 'https://web.whatsapp.com/'"));
  });

  await run('NEW_BLOCK preserva o abort do check-update e termina em continue', () => {
    assert.ok(NEW_BLOCK.includes("req.url().startsWith('https://web.whatsapp.com/check-update')"));
    assert.ok(NEW_BLOCK.includes('req.abort();'));
    const lines = NEW_BLOCK.split('\n');
    assert.ok(lines[lines.length - 1].includes('req.continue();'));
  });

  console.log('\n== applyPatch (diretório temporário) ==');

  await run('assinatura 1x -> aplica e grava NEW_BLOCK + MARKER', () => {
    const file = tmpFile(makeFakeDist(1));
    const res = applyPatch({ target: file });
    assert.equal(res.ok, true);
    assert.equal(res.applied, true);
    const out = fs.readFileSync(file, 'utf8');
    assert.ok(out.includes(MARKER));
    assert.ok(out.includes('const u_pin_wpp = new URL(req.url());'));
    assert.ok(!out.includes("req.url() !== 'https://web.whatsapp.com/'"));
  });

  await run('idempotente: aplicar 2x não duplica nem corrompe', () => {
    const file = tmpFile(makeFakeDist(1));
    const first = applyPatch({ target: file });
    const second = applyPatch({ target: file });
    assert.equal(first.applied, true);
    assert.equal(second.alreadyApplied, true);
    const out = fs.readFileSync(file, 'utf8');
    assert.equal((out.match(/domnex-pin-whatsapp-version:applied/g) || []).length, 1);
    assert.equal((out.match(/const u_pin_wpp = new URL/g) || []).length, 1);
  });

  await run('--dry-run não grava nada e reporta dryRun', () => {
    const file = tmpFile(makeFakeDist(1));
    const before = fs.readFileSync(file, 'utf8');
    const res = applyPatch({ target: file, dryRun: true });
    assert.equal(res.ok, true);
    assert.equal(res.dryRun, true);
    assert.equal(res.applied, undefined);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  });

  await run('assinatura 0x -> recusa aplicar (não corrompe)', () => {
    const content = '// arquivo de outro pacote, sem interceptor';
    const file = tmpFile(content);
    const res = applyPatch({ target: file });
    assert.equal(res.ok, false);
    assert.match(res.message, /assinatura inesperada/);
    assert.equal(fs.readFileSync(file, 'utf8'), content);
  });

  await run('assinatura 2x -> recusa aplicar (não corrompe)', () => {
    const file = tmpFile(makeFakeDist(2));
    const res = applyPatch({ target: file });
    assert.equal(res.ok, false);
    assert.match(res.message, /esperava o interceptor do dist 2\.3\.3 exatamente 1x/);
    assert.equal((fs.readFileSync(file, 'utf8').match(/req\.respond/g) || []).length, 2);
  });

  await run('marcador já presente -> alreadyApplied sem regravar', () => {
    const file = tmpFile(makeFakeDist(1) + '\n' + MARKER);
    const res = applyPatch({ target: file });
    assert.equal(res.ok, true);
    assert.equal(res.alreadyApplied, true);
  });

  await run('arquivo inexistente -> ok false com mensagem clara', () => {
    const res = applyPatch({ target: path.join(os.tmpdir(), 'nao-existe-browser.js') });
    assert.equal(res.ok, false);
    assert.match(res.message, /não consegui ler/);
  });

  if (fs.existsSync(TARGET)) {
    console.log('\n== Artefato real instalado (node_modules) ==');
    const src = fs.readFileSync(TARGET, 'utf8');
    await run('dist instalado tem o patch aplicado (marcador presente)', () => {
      assert.ok(src.includes(MARKER), 'o dist real ainda não foi patchado; rode o script');
    });
    await run('dist real: match por origin+pathname presente e match exato antigo removido', () => {
      assert.ok(src.includes("u_pin_wpp.origin === \"https://web.whatsapp.com\" && u_pin_wpp.pathname === \"/\" && isMainNav_wpp"));
      assert.ok(!src.includes("req.url() !== 'https://web.whatsapp.com/'"));
    });
    await run('dist real: check-update continua abortado', () => {
      assert.ok(src.includes("req.url().startsWith('https://web.whatsapp.com/check-update')"));
      assert.ok(src.includes('req.abort();'));
    });
    await run('dist real: applyPatch reporta alreadyApplied (idempotente no build)', () => {
      const res = applyPatch({});
      assert.equal(res.ok, true);
      assert.equal(res.alreadyApplied, true);
    });
  } else {
    console.log('\n[skip] node_modules não instalado; pulando validação do dist real');
  }

  console.log(`\n${passed} testes ok, ${failures.length} falhas\n`);
  process.exit(failures.length > 0 ? 1 : 0);
})();