'use strict';
// Testes do AffiliateLinkConverter (sem dependências).
// Contrato: sourceUrl, subIds, affiliateUrl, marketplace, converted.
// Execução:  node linkConversion/tests/affiliateLinkConverter.test.js
const assert = require('node:assert/strict');
const {
  createAffiliateLinkConverter,
  extractUrls,
  isShopeeUrl,
} = require('../index.js');

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

// Gerador FIXO de teste (não representa link real da Shopee).
// Contrato do generator: recebe { sourceUrl, subIds, trackId }
// e deve devolver { affiliateUrl } quando bem-sucedido.
const TEST_GENERATOR = async ({ sourceUrl, subIds }) => ({
  affiliateUrl:
    `https://afiliado.test/r/${(subIds && subIds[0]) || 'sem-track'}` +
    `?u=${encodeURIComponent(sourceUrl)}`,
});

const TEST_SUB_IDS = ['ID001', 'campanha2026'];

function makeConverter({ subIds, legacyTrackId, generator, enabled } = {}) {
  const getConfig = async () => ({
    linkConversion: {
      enabled: enabled !== false,
      shopee: {
        ...(subIds ? { subIds } : {}),
        ...(legacyTrackId ? { trackId: legacyTrackId } : {}),
      },
    },
  });
  return createAffiliateLinkConverter({
    getConfig,
    shopeeDeeplinkGenerator: generator === undefined ? TEST_GENERATOR : generator,
  });
}

const pendingConverter = createAffiliateLinkConverter(); // sem gerador

(async () => {
  console.log('\n== Detecção Shopee ==');
  await run('detecta https://shopee.com.br/item/123', () => assert.equal(isShopeeUrl('https://shopee.com.br/item/123'), true));
  await run('detecta shopee.com sem esquema', () => assert.equal(isShopeeUrl('shopee.com.br/item/123'), true));
  await run('detecta encurtador shp.ee', () => assert.equal(isShopeeUrl('https://shp.ee/abc123'), true));
  await run('NAO detecta link comum (google)', () => assert.equal(isShopeeUrl('https://google.com/x'), false));
  await run('NAO detecta texto invalido', () => assert.equal(isShopeeUrl('não é url'), false));

  console.log('\n== Extração de URLs ==');
  await run('texto sem link -> []', () => assert.deepEqual(extractUrls('sem links aqui'), []));
  await run('extrai e mantém pontuação final fora da URL', () => {
    const found = extractUrls('veja https://shopee.com.br/item/1.');
    assert.equal(found.length, 1);
    assert.equal(found[0].raw, 'https://shopee.com.br/item/1');
    assert.equal(found[0].url, 'https://shopee.com.br/item/1');
  });
  await run('não duplica URLs repetidas', () => {
    assert.equal(extractUrls('a https://google.com e https://google.com').length, 1);
  });

  console.log('\n== Conversão: contrato novo ==');
  const noLinkText = 'apenas texto corrido, sem nenhum link';
  await run('texto sem link inalterado', async () => {
    const r = await makeConverter().convertText('s1', noLinkText);
    assert.equal(r.text, noLinkText);
    assert.equal(r.converted, 0);
    assert.deepEqual(r.conversions, []);
  });

  const commonText = 'Acesse https://google.com/resultado e pronto';
  await run('link comum preservado (marketplace null)', async () => {
    const r = await makeConverter().convertText('s1', commonText);
    assert.equal(r.text, commonText);
    assert.equal(r.converted, 0);
    assert.equal(r.conversions[0].marketplace, null);
  });

  const oneShopee = 'Promo incrível: https://shopee.com.br/item/998877?sp_atk=xyz! Corre!';
  await run('1 link Shopee com gerador pendente -> preservado, campos corretos', async () => {
    const r = await pendingConverter.convertText('s1', oneShopee);
    assert.equal(r.text, oneShopee);
    assert.equal(r.converted, 0);
    assert.equal(r.conversions[0].marketplace, 'shopee');
    assert.equal(r.conversions[0].affiliateUrl, null);
    assert.equal(r.conversions[0].sourceUrl, 'https://shopee.com.br/item/998877?sp_atk=xyz');
  });

  await run('1 link Shopee com subIds -> substituído, subIds no resultado', async () => {
    const r = await makeConverter({ subIds: TEST_SUB_IDS }).convertText('s1', oneShopee);
    assert.equal(r.converted, 1);
    assert.equal(r.conversions[0].converted, true);
    assert.ok(r.conversions[0].affiliateUrl.startsWith('https://afiliado.test/r/'));
    assert.ok(r.text.includes('afiliado.test/r/ID001'));
    assert.ok(!r.text.includes('shopee.com.br/item/998877'));
    assert.deepEqual(r.conversions[0].subIds, TEST_SUB_IDS);
  });

  const punctText = 'Só hoje: https://shopee.com.br/item/77. Não perca!';
  await run('ponto final após URL preservado after conversão', async () => {
    const r = await makeConverter().convertText('s1', punctText);
    assert.equal(r.converted, 1);
    assert.equal(r.text, 'Só hoje: https://afiliado.test/r/sem-track?u=https%3A%2F%2Fshopee.com.br%2Fitem%2F77. Não perca!');
  });

  const mixed = 'Google: https://google.com/ok · loja: https://shopee.com.br/item/50 ·\nencurtado: https://shp.ee/qq1 e depois /mercado/';
  await run('vários links misturados -> só Shopee convertidos', async () => {
    const r = await makeConverter().convertText('s1', mixed);
    assert.equal(r.converted, 2);
    assert.ok(!r.text.includes('shopee.com.br/item/50'));
    assert.ok(!r.text.includes('shp.ee/qq1'));
    assert.ok(r.text.includes('https://google.com/ok'));
    assert.ok(r.text.includes('e depois /mercado/'));
  });

  const broken = async () => { throw new Error('API de afiliado fora do ar'); };
  await run('falha do converter -> URL original mantida, sem lançar', async () => {
    const r = await makeConverter({ generator: broken }).convertText('s1', oneShopee);
    assert.equal(r.text, oneShopee);
    assert.equal(r.converted, 0);
    assert.equal(r.conversions[0].error, 'API de afiliado fora do ar');
  });

  await run('getConfig quebrada -> sem exceção, sem trava, sem lixo', async () => {
    const c = createAffiliateLinkConverter({
      getConfig: async () => { throw new Error('config quebrada'); },
      shopeeDeeplinkGenerator: TEST_GENERATOR,
    });
    const r = await c.convertText('s1', oneShopee);
    assert.ok(r.text.length > 0);
    assert.ok(!r.text.includes('undefined'));
  });

  await run('conversão desativada (enabled:false) -> preservado', async () => {
    const r = await makeConverter({ enabled: false }).convertText('s1', oneShopee);
    assert.equal(r.text, oneShopee);
    assert.equal(r.converted, 0);
    assert.equal(r.conversions[0].reason, 'conversão desativada na configuração');
  });

  await run('trackId legado vira subIds[0] e segue acessível (compat temporária)', async () => {
    let received = null;
    const recorder = async (input) => { received = input; return { affiliateUrl: 'https://s.shopee.com.br/compat' }; };
    const r = await makeConverter({ legacyTrackId: 'LEGACY_XPTO', generator: recorder }).convertText('s1', oneShopee);
    assert.equal(r.converted, 1);
    assert.deepEqual(received.subIds, ['LEGACY_XPTO']);
    assert.equal(received.trackId, 'LEGACY_XPTO'); // compat mantida p/ gerador antigo
    assert.equal(r.conversions[0].affiliateUrl, 'https://s.shopee.com.br/compat');
  });

  await run('subIds e trackId legado coexistem; subIds tem prioridade', async () => {
    let received = null;
    const recorder = async (input) => { received = input; return { affiliateUrl: 'https://ok' }; };
    await makeConverter({ subIds: ['A', 'B'], legacyTrackId: 'LEG', generator: recorder }).convertText('s1', oneShopee);
    assert.deepEqual(received.subIds, ['A', 'B']);
    assert.equal(received.trackId, null);
  });

  await run('subIds respeitam limite de 5', async () => {
    let received = null;
    const recorder = async (input) => { received = input; return { affiliateUrl: 'https://ok' }; };
    await makeConverter({ subIds: ['1','2','3','4','5','6','7'], generator: recorder }).convertText('s1', oneShopee);
    assert.equal(received.subIds.length, 5);
    assert.deepEqual(received.subIds, ['1','2','3','4','5']);
  });

  await run('generator recebe { sourceUrl, subIds, trackId }', async () => {
    let input = null;
    const recorder = async (i) => { input = i; return { affiliateUrl: 'https://s.shopee.com.br/test' }; };
    const c = createAffiliateLinkConverter({
      getConfig: async () => ({ linkConversion: { shopee: { subIds: ['ID1'] } } }),
      shopeeDeeplinkGenerator: recorder,
    });
    await c.convertText('s1', oneShopee);
    assert.ok('sourceUrl' in input);
    assert.ok('subIds' in input);
    assert.ok('trackId' in input);
    assert.deepEqual(input.subIds, ['ID1']);
  });

  console.log(`\n${passed} testes ok, ${failures.length} falhas\n`);
  process.exit(failures.length > 0 ? 1 : 0);
})();
