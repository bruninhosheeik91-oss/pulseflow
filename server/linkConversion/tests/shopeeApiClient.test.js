'use strict';
// Testes da Shopee Affiliate Open API client (mocks; sem rede real).
// Execução:  node linkConversion/tests/shopeeApiClient.test.js
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const {
  createShopeeApiClient,
  ShopeeAffiliateApiError,
  ShopeeAffiliateCredentialError,
} = require('../shopeeApiClient.js');

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

const APP_ID = 'TEST_APP_123';
const SECRET = 'SUPER_SEGREDO_TESTE';
const API_URL = 'https://open-api.affiliate.shopee.com.br/graphql';
const PRODUCT_URL = 'https://shopee.com.br/item/998877';
const okEnv = { SHOPEE_AFFILIATE_APP_ID: APP_ID, SHOPEE_AFFILIATE_SECRET: SECRET, SHOPEE_AFFILIATE_API_URL: API_URL };

// Mini-fetch fake: devolve resposta programada e registra o request.
function jsonFetch(programmed) {
  const calls = [];
  const impl = async (url, init = {}) => {
    const call = { url, init, body: init.body };
    calls.push(call);
    return programmed(call);
  };
  return { impl, calls };
}

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(data);
    },
  };
}

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

(async () => {
  console.log('\n== ShopeeAffiliateApiClient ==');

  await run('sucesso -> { affiliateUrl } e assinatura SHA256 correta', async () => {
    const { impl, calls } = jsonFetch(() => jsonResponse(200, {
      data: { generateShortLink: { shortLink: 'https://s.shopee.com.br/abc' } },
    }));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    const result = await client.generateShortLink({ sourceUrl: PRODUCT_URL, subIds: ['G1'] });

    assert.equal(result.affiliateUrl, 'https://s.shopee.com.br/abc');
    assert.equal(calls.length, 1);
    const { init, body } = calls[0];
    assert.equal(init.method, 'POST');
    assert.equal(init.headers['Content-Type'], 'application/json');

    const auth = init.headers['Authorization'];
    const m = /^SHA256 Credential=(.+), Timestamp=(\d+), Signature=([0-9a-f]{64})$/i.exec(auth);
    assert.ok(m, 'formato do header Authorization incorreto');
    const [, credential, timestamp, signature] = m;
    assert.equal(credential, APP_ID);
    assert.equal(signature, sha256Hex(`${APP_ID}${timestamp}${body}${SECRET}`));

    const parsed = JSON.parse(body);
    assert.ok(parsed.query.includes('generateShortLink'));
    assert.ok(parsed.query.includes(JSON.stringify(PRODUCT_URL)));
    assert.ok(parsed.query.includes('"G1"'));
  });

  await run('HTTP 400 -> ShopeeAffiliateApiError (não-credencial)', async () => {
    const { impl } = jsonFetch(() => jsonResponse(400, { message: 'input inválido' }));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateApiError && !(err instanceof ShopeeAffiliateCredentialError) && err.httpStatus === 400
    );
  });

  await run('HTTP 401 -> ShopeeAffiliateCredentialError', async () => {
    const { impl } = jsonFetch(() => jsonResponse(401, { message: 'unauthorized' }));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateCredentialError && err.httpStatus === 401
    );
  });

  await run('HTTP 500 -> ShopeeAffiliateApiError', async () => {
    const { impl } = jsonFetch(() => jsonResponse(500, {}));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateApiError && err.httpStatus === 500
    );
  });

  await run('timeout -> abort disparado e erro kind timeout', async () => {
    // fake que fica pendente até o AbortSignal do client ser disparado
    const hanging = (_url, init) =>
      new Promise((_resolve, reject) => {
        const onAbort = () => {
          const e = new Error('aborted');
          e.name = 'AbortError';
          reject(e);
        };
        init.signal.addEventListener('abort', onAbort, { once: true });
      });
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: hanging, timeoutMs: 60 });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateApiError && err.kind === 'timeout' && err.message.includes('Timeout')
    );
  });

  await run('falha de rede -> erro de rede (kind network)', async () => {
    const netDown = async () => { throw new Error('ECONNREFUSED'); };
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: netDown });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateApiError && err.kind === 'network'
    );
  });

  await run('resposta 200 sem shortLink -> erro invalid_response', async () => {
    const { impl } = jsonFetch(() => jsonResponse(200, { data: { generateShortLink: { shortLink: null } } }));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateApiError && err.kind === 'invalid_response'
    );
  });

  await run('resposta 200 com errors GraphQL -> erro graphql', async () => {
    const { impl } = jsonFetch(() => jsonResponse(200, { errors: [{ message: 'URL inválida' }] }));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateApiError && err.kind === 'graphql' && err.message.includes('URL inválida')
    );
  });

  await run('SubIds: até 5, sanitizado (trim/vazios fora)', async () => {
    const { impl, calls } = jsonFetch(() => jsonResponse(200, { data: { generateShortLink: { shortLink: 'https://s.shopee.com.br/x' } } }));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    await client.generateShortLink({ sourceUrl: PRODUCT_URL, subIds: [' a ', ' ', 'b', 'c', 'd', 'e', 'f'] });
    const body = JSON.parse(calls[0].body);
    assert.ok(body.query.includes('"a", "b", "c", "d", "e"'));
    assert.ok(!body.query.includes('"f"'));
  });

  await run('sem subIds -> query sem subIds', async () => {
    const { impl, calls } = jsonFetch(() => jsonResponse(200, { data: { generateShortLink: { shortLink: 'https://s.shopee.com.br/x' } } }));
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: impl });
    await client.generateShortLink({ sourceUrl: PRODUCT_URL });
    const body = JSON.parse(calls[0].body);
    assert.ok(!body.query.includes('subIds'));
  });

  await run('credenciais ausentes -> CredentialError antes de qualquer rede', async () => {
    let called = false;
    const spy = async () => { called = true; return jsonResponse(200, {}); };
    const client = createShopeeApiClient({ env: {}, fetchImpl: spy });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: PRODUCT_URL }),
      (err) => err instanceof ShopeeAffiliateCredentialError
    );
    assert.equal(called, false);
  });

  await run('API_URL ausente usa default oficial BR', async () => {
    const { impl, calls } = jsonFetch(() => jsonResponse(200, { data: { generateShortLink: { shortLink: 'https://s.shopee.com.br/y' } } }));
    const client = createShopeeApiClient({ env: { SHOPEE_AFFILIATE_APP_ID: APP_ID, SHOPEE_AFFILIATE_SECRET: SECRET }, fetchImpl: impl });
    await client.generateShortLink({ sourceUrl: PRODUCT_URL });
    assert.equal(calls[0].url, 'https://open-api.affiliate.shopee.com.br/graphql');
  });

  await run('sourceUrl ausente -> erro', async () => {
    const client = createShopeeApiClient({ env: okEnv, fetchImpl: async () => jsonResponse(200, {}) });
    await assert.rejects(
      client.generateShortLink({ sourceUrl: '' }),
      (err) => err instanceof ShopeeAffiliateApiError && err.message.includes('sourceUrl')
    );
  });

  console.log(`\n${passed} testes ok, ${failures.length} falhas\n`);
  process.exit(failures.length > 0 ? 1 : 0);
})();