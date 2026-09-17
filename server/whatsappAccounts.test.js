'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const SERVER_ENTRY = path.join(__dirname, 'server.js');

// Pasta de state isolada para o teste — nunca toca no /data real de produção.
const STATE_DIR = path.join(
  os.tmpdir(),
  `wpp-accts-test-${process.pid}-${Date.now()}`
);
const SESSION_DIR = path.join(STATE_DIR, 'tokens');
const ACCOUNTS_FILE = path.join(STATE_DIR, 'data', 'accounts.json');

const LEGACY_SESSION_DIR = path.join(SESSION_DIR, 'domnex-main');

function writeAccounts(content) {
  mkdirSync(path.dirname(ACCOUNTS_FILE), { recursive: true });
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(content, null, 2), 'utf8');
}

function seedLegacyTokenFolder() {
  // Simula sessão antiga "domnex-main" existindo apenas como pasta de tokens.
  const target = path.join(LEGACY_SESSION_DIR, 'Default', 'Local Storage');
  mkdirSync(target, { recursive: true });
  writeFileSync(path.join(target, '.keep'), 'token-stealth', 'utf8');
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function spawnServer(port) {
  const child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      PULSEFLOW_STATE_DIR: STATE_DIR,
      // Evita disparar um Chrome real durante a criação de conta no teste.
      WPP_CHROME_PATH: path.join('Z:', 'nope', 'chrome-not-found.exe'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => {
    stdout += String(d);
  });
  child.stderr.on('data', (d) => {
    stderr += String(d);
  });

  return { child, getOutput: () => ({ stdout, stderr }) };
}

async function waitForListening(proc, timeoutMs = 15_000) {
  const start = Date.now();
  for (;;) {
    const { stdout, stderr } = proc.getOutput();
    if (stdout.includes('API escutando')) return;
    if (proc.child.exitCode !== null) {
      throw new Error(
        `servidor encerrou cedo (code=${proc.child.exitCode})\n${stderr}`
      );
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `servidor não iniciou em ${timeoutMs}ms\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function stopServer(proc) {
  return new Promise((resolve) => {
    if (proc.exitCode !== null || proc.killed) {
      resolve();
      return;
    }
    proc.once('exit', resolve);
    proc.kill('SIGTERM');
    setTimeout(() => {
      if (proc.exitCode === null && !proc.killed) proc.kill('SIGKILL');
    }, 3000);
  });
}

async function withServer(fn) {
  const port = await getFreePort();
  const proc = spawnServer(port);
  await waitForListening(proc);
  const base = `http://127.0.0.1:${port}`;
  try {
    return await fn(base);
  } finally {
    await stopServer(proc.child);
  }
}

async function getAccounts(base) {
  const res = await fetch(`${base}/api/whatsapp/accounts`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.ok, true);
  return body.accounts || [];
}

async function createAccount(base, name) {
  const res = await fetch(`${base}/api/whatsapp/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.ok, true);
  return body.account;
}

// Limpeza best-effort: no Windows um Chrome/handle órfão pode manter o diretório
// travado por alguns instantes. A limpeza NUNCA deve mascarar o resultado real.
function cleanupStateDir() {
  try {
    rmSync(STATE_DIR, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    });
  } catch {
    // diretório temporário — deixado para o SO limpar
  }
}

async function run() {
  cleanupStateDir();

  // ===== A) token domnex-main existe + accounts.json vazio => GET /accounts = [] =====
  seedLegacyTokenFolder();
  writeAccounts({ accounts: [] });
  await withServer(async (base) => {
    const list = await getAccounts(base);
    assert.deepStrictEqual(list, [], 'A: accounts deve ser [] com token órfão no disco');
    assert.ok(
      existsSync(LEGACY_SESSION_DIR),
      'A: pasta de tokens legacy permanece preservada'
    );

    // QR não nasce sozinho: rota legada não devolve QR sem conta criada.
    const qrRes = await fetch(`${base}/api/whatsapp/qr`);
    assert.strictEqual(qrRes.status, 204, 'A: rotas legadas não devem gerar QR');
  });
  console.log('A) OK: token órfão no disco + accounts.json vazio => GET /accounts = []');

  // ===== B) accounts.json com domnex-main legado => GET /accounts = [] =====
  writeAccounts({
    accounts: [
      {
        sessionId: 'domnex-main',
        name: 'Conta principal',
        phone: null,
        createdAt: '2026-09-12T04:10:28.828Z',
      },
    ],
  });
  await withServer(async (base) => {
    const list = await getAccounts(base);
    assert.deepStrictEqual(list, [], 'B: domnex-main legado NÃO pode ser conta ativa');
    assert.ok(
      existsSync(LEGACY_SESSION_DIR),
      'B: pasta de tokens legacy continua no disco (sem logout/apagamento)'
    );

    // Registry é re-escrito sem o legado (accounts.json = só contas do usuário).
    const persisted = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'));
    assert.ok(
      Array.isArray(persisted.accounts) && persisted.accounts.length === 0,
      'B: accounts.json deve conter apenas contas criadas pelo usuário'
    );

    // Rota legada não pode iniciar sessão automaticamente.
    const connectRes = await fetch(`${base}/api/whatsapp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(connectRes.status, 404, 'B: legado NÃO pode iniciar sessão');

    const statusRes = await fetch(`${base}/api/whatsapp/status`);
    const statusBody = await statusRes.json();
    assert.strictEqual(statusBody.connected, false, 'B: estado legado é desconectado');
  });
  console.log('B) OK: domnex-main legado sai do registry sem apagar tokens');

  // ===== C) criar "Loja Centro" => GET /accounts = 1 conta criada pelo usuário =====
  await withServer(async (base) => {
    const created = await createAccount(base, 'Loja Centro');
    assert.strictEqual(created.displayName, 'Loja Centro');
    assert.strictEqual(created.createdByUser, true, 'C: conta nova deve ter createdByUser=true');

    const list = await getAccounts(base);
    assert.strictEqual(list.length, 1, 'C: deve existir exatamente 1 conta');
    assert.strictEqual(list[0].displayName, 'Loja Centro');
    assert.strictEqual(list[0].createdByUser, true);
    assert.ok(/^wa_/.test(list[0].sessionId), 'C: sessionId técnico wa_xxx');
    assert.ok(
      !list.some((acc) => acc.sessionId === 'domnex-main'),
      'C: domnex-main nunca aparece na lista'
    );
  });
  console.log('C) OK: criação de "Loja Centro" registrada com createdByUser=true');

  // ===== D) restart do backend => "Loja Centro" continua existindo =====
  await withServer(async (base) => {
    const list = await getAccounts(base);
    assert.strictEqual(list.length, 1, 'D: conta persiste após restart');
    assert.strictEqual(list[0].displayName, 'Loja Centro');
    assert.strictEqual(list[0].createdByUser, true);
    assert.ok(
      existsSync(LEGACY_SESSION_DIR),
      'D: pasta de tokens legacy continua preservada até aqui'
    );
  });

  // D.2) Cancelamento/remoção de conta pendente remove o registro sem ghost card.
  await withServer(async (base) => {
    const pending = await createAccount(base, 'Atendimento');
    const res = await fetch(
      `${base}/api/whatsapp/${encodeURIComponent(pending.sessionId)}/account`,
      { method: 'DELETE' }
    );
    assert.strictEqual(res.status, 200);
    const list = await getAccounts(base);
    assert.strictEqual(list.length, 1, 'D: conta pendente removida não deixa ghost');
    assert.strictEqual(list[0].displayName, 'Loja Centro');
    assert.ok(
      existsSync(LEGACY_SESSION_DIR),
      'E: tokens legacy intactos após criação/remoção de contas'
    );
  });
  console.log('D/E) OK: restart preserva "Loja Centro"; token legacy segue intacto');

  cleanupStateDir();
  console.log('whatsappAccounts.test.js: TODAS AS VERIFICAÇÕES PASSARAM');
}

run().catch((err) => {
  console.error('\nwhatsappAccounts.test.js: FALHOU');
  console.error(err && err.stack ? err.stack : String(err));
  cleanupStateDir();
  process.exit(1);
});