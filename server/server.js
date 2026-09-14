'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const { create } = require('@wppconnect-team/wppconnect');
const { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } = require('fs');
const { spawn } = require('child_process');
const {
  createAffiliateCredentialsStore,
  EncryptionKeyMissingError,
} = require('./linkConversion/affiliateCredentialsStore.js');
const {
  runSearch: runShopeeAutoSearch,
  buildMessageFromTemplate,
  normalizeShopeeNode,
} = require('./linkConversion/shopeeAutoSearch.js');
const { createShopeeApiClient } = require('./linkConversion/shopeeApiClient.js');
const { isShopeeUrl } = require('./linkConversion/shopeeConverter.js');
const { buildDynamicMonitorOfferMessage } = require('./monitorOfferMessage.js');
const {
  normalizeMonitorMessage,
  resolveMonitorRoute,
  createMonitorDeduper,
} = require('./monitorPipeline.js');
const {
  createTenantAutomationsStore,
} = require('./linkConversion/tenantAutomationsStore.js');
const {
  createTenantAutoSearchSendsStore,
} = require('./linkConversion/tenantAutoSearchSendsStore.js');
const { createTenantLinkListsStore } = require('./linkConversion/tenantLinkListsStore.js');

// Carrega server/.env (KEY=VAL, gitignored) para o runtime Node local, mesmo
// padrão do helper test-real-shopee.js. Sem isso, `node server.js` rodaria sem
// ENCRYPTION_KEY: segredos salvos não poderiam ser decifrados nem re-cifrados.
// Variáveis já presentes no ambiente NUNCA são sobrescritas (deploy vence).
try {
  const envFilePath = path.join(__dirname, '.env');
  if (existsSync(envFilePath)) {
    for (const line of readFileSync(envFilePath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = val;
    }
  }
} catch {
  // Sem .env o servidor sobe mesmo assim; segredos ficam indisponíveis.
}

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';
const DOMNEX_DEFAULT_SESSION = 'domnex-main';
// Limite técnico de contas, opcional e configurável por ambiente.
// 0 (padrão) = ilimitado. Caso um plano comercial limite a quantidade no
// futuro, basta definir MAX_WHATSAPP_ACCOUNTS no ambiente do servidor.
const MAX_ACCOUNTS = Number(process.env.MAX_WHATSAPP_ACCOUNTS || 0);
// Estado persistente do backend. PULSEFLOW_STATE_DIR=/data em produção
// (Railway mantém volume montado em /data); local sem a variável usa __dirname.
const STATE_DIR = process.env.PULSEFLOW_STATE_DIR
  ? path.resolve(String(process.env.PULSEFLOW_STATE_DIR))
  : __dirname;
const SESSION_DIR = path.join(STATE_DIR, 'tokens');
const DATA_DIR = path.join(STATE_DIR, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const CHROME_PATH =
  process.env.WPP_CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RECENT_LIMIT = 200;

const SESSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

// ===== Credenciais de Afiliados por Cliente (multi-tenant) =====
// Cada cliente (tenant) mantém as PRÓPRIAS credenciais dos programas de
// afiliados. Segredos são cifrados em repouso; nunca voltam ao frontend e
// nunca aparecem em logs. Persistência: server/data/credentials/<tenant>.json
const affiliateStore = createAffiliateCredentialsStore({ dataDir: DATA_DIR });
const automationsStore = createTenantAutomationsStore({ dataDir: DATA_DIR });
const autoSearchSendsStore = createTenantAutoSearchSendsStore({ dataDir: DATA_DIR });
const linkListsStore = createTenantLinkListsStore({ dataDir: DATA_DIR });

function logInfo(message) {
  console.log(`[info] ${new Date().toISOString()} ${message}`);
}

function logError(message) {
  console.error(`[error] ${new Date().toISOString()} ${message}`);
}

function logWhatsApp(message) {
  console.log(`[WhatsApp] ${new Date().toISOString()} ${message}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== Sessões (uma por conta WhatsApp) =====
function createSessionState(sessionId) {
  return {
    sessionId,
    client: null,
    connectionState: 'disconnected',
    qrCode: null,
    lastError: null,
    starting: false,
    // Geração monotônica da inicialização: cada createSession/recover incrementa
    // o contador. Callbacks assíncronos (QR, statusFind, socket, listeners)
    // capturam a geração em que foram criados e são IGNORADOS se ela mudou —
    // impede que um timeout antigo ou um QR/browser órfão sobrescreva um estado
    // posterior (ex.: connected).
    initGen: 0,
    initRetries: 0,
    // Vigilância de QR/init: evita "Gerando QR Code..." infinito quando o
    // WPPConnect fica sem canvas de QR real ("QR (undefined)" / sessão não
    // pareada) ou quando a inicialização trava (wapi.js failed / timeout).
    qrStuckBaseAt: null,
    qrLastDataAt: null,
    qrWatchdog: null,
    recentMessages: [],
    connectedAt: null,
    lastSyncAt: null,
    deviceName: null,
    devicePhone: null,
  };
}

// Se nenhum QR real chegar dentro deste limite estando 'awaiting_qr', a
// sessão vai para 'error' (a UI mostra o erro + "Tentar novamente").
const QR_STUCK_TIMEOUT_MS = 60_000;
const QR_WATCHDOG_INTERVAL_MS = 4_000;

function clearQrWatchdog(state) {
  if (state.qrWatchdog) {
    clearInterval(state.qrWatchdog);
    state.qrWatchdog = null;
  }
  state.qrStuckBaseAt = null;
}

// Vigilância única do ciclo de inicialização/QR. Começa no createSession e só
// é encerrada ao conectar, ao exibir QR REAL ou ao falhar de vez.
// - Com QR REAL exibido: não intervém (o WA rotaciona o QR e mantém qrCode).
// - Sem QR REAL por mais de QR_STUCK_TIMEOUT_MS (canvas "QR (undefined)",
//   catraca travada em wapi.js/timeout, etc.): estado de erro + recuperação.
function startQrStuckWatchdog(state) {
  if (state.qrWatchdog) return;
  state.qrStuckBaseAt = Date.now();
  state.qrWatchdog = setInterval(() => {
    if (state.connectionState === 'connected') {
      clearQrWatchdog(state);
      return;
    }
    if (state.qrCode && state.qrCode.length) {
      return;
    }
    const base = state.qrStuckBaseAt || Date.now();
    if (Date.now() - base > QR_STUCK_TIMEOUT_MS) {
      clearQrWatchdog(state);
      state.qrCode = null;
      state.lastError =
        'Falha ao gerar o QR Code real (sessão não pareada). Toque em "Tentar novamente" para gerar um novo QR.';
      setSessionState(state, 'error');
      logError(
        `[WhatsApp ${state.sessionId}] nenhum QR real em ${
          QR_STUCK_TIMEOUT_MS / 1000
        }s - estado de erro + recuperação disponível`
      );
    }
  }, QR_WATCHDOG_INTERVAL_MS);
}

// Entrada no estado "aguardando QR". SÓ quando há QR REAL para exibir. Sem QR,
// permanece no estado intermediário honesto (connecting/reconnecting) e a
// vigilância é quem decide entre error e conexão.
function enterAwaitingQr(state) {
  if (!state.qrCode || !state.qrCode.length) {
    return;
  }
  if (state.connectionState !== 'connected') {
    setSessionState(state, 'awaiting_qr');
  }
}

// Ciclo de vida do Chromium do WPPConnect. No Linux/Railway, browsers órfãos
// seguram o userDataDir da sessão (/data/tokens/<sessionId>) e fazem o próximo
// create() falhar com "The browser is already running...". O encerramento é
// best-effort, com escopo ESTRITO por sessão: apenas processos Chromium cujo
// cmdline contém o userDataDir da sessão são encerrados. Aguarda o término real
// do processo e remove SOMENTE os locks transitórios do perfil (SingletonLock,
// SingletonSocket, SingletonCookie). NUNCA apaga Local Storage, IndexedDB,
// Session Storage, tokens ou cookies — a auth existente é preservada.
const IS_WINDOWS = process.platform === 'win32';
const CHROMIUM_SINGLETON_LOCKS = [
  'SingletonLock',
  'SingletonSocket',
  'SingletonCookie',
];

// PIDs de processos Chromium associados ao userDataDir da sessão (Linux).
// Lê /proc/<pid>/cmdline; casa o binário Chromium + o caminho do perfil.
function linuxChromiumPidsForProfile(profilePath) {
  const pids = [];
  try {
    for (const entry of readdirSync('/proc')) {
      if (!/^\d+$/.test(entry)) continue;
      const cmdlineFile = path.join('/proc', entry, 'cmdline');
      try {
        const cmdline = readFileSync(cmdlineFile, 'utf8').replace(/\0/g, ' ');
        if (cmdline.includes('chrom') && cmdline.includes(profilePath)) {
          pids.push(Number(entry));
        }
      } catch {
        // processo já encerrou entre a listagem e a leitura
      }
    }
  } catch {
    // /proc indisponível (não-Linux)
  }
  return pids;
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === 'EPERM';
  }
}

// Aguarda os PIDs realmente saírem (polling, até timeoutMs).
async function waitForPidsToExit(pids, timeoutMs) {
  const remaining = new Set(pids);
  const deadline = Date.now() + timeoutMs;
  while (remaining.size > 0 && Date.now() < deadline) {
    for (const pid of [...remaining]) {
      if (!pidAlive(pid)) remaining.delete(pid);
    }
    if (remaining.size > 0) await sleep(200);
  }
  return remaining.size === 0;
}

// Windows: mantém o comportamento original via PowerShell/Win32_Process.
function killSessionBrowserWindows(sessionId, profilePath) {
  const ps = `
& {
  $profile = $args[0]
  if (-not (Test-Path -LiteralPath $profile)) { return }
  Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object {
    $cmd = $_.CommandLine
    if (-not $cmd) { return $false }
    if ($cmd -like '*--type=*') { return $false }
    $cmd.ToLower().Contains($profile.ToLower())
  } | ForEach-Object {
    try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop | Out-Null } catch { }
  }
}`;
  const proc = spawn(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-Command', ps, profilePath],
    { windowsHide: true }
  );
  proc.on('error', () => {});
  proc.unref();
}

// Linux/POSIX: encerra SOMENTE os Chromium do userDataDir da sessão e aguarda o
// término efetivo antes de retornar.
async function killSessionBrowserPosix(profilePath) {
  const pids = linuxChromiumPidsForProfile(profilePath);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // processo já saiu
    }
  }
  if (pids.length > 0) {
    await waitForPidsToExit(pids, 10000);
  }
}

// Remove apenas os locks transitórios do perfil. Nunca toca em autenticação.
function removeSessionSingletonLocks(profilePath) {
  for (const name of CHROMIUM_SINGLETON_LOCKS) {
    try {
      const target = path.join(profilePath, name);
      if (existsSync(target)) rmSync(target, { force: true });
    } catch (err) {
      logError(
        `[browser] falha ao remover lock transitório ${name}: ${String((err && err.message) || err)}`
      );
    }
  }
}

// Encerramento best-effort: encerra o browser órfão da sessão (somente os
// processos do userDataDir /data/tokens/<sessionId>), aguarda o término e
// remove só os locks transitórios. Autenticação em /data é preservada.
async function ensureSessionBrowserStopped(sessionId) {
  const profilePath = path.join(SESSION_DIR, sessionId);
  if (IS_WINDOWS) {
    killSessionBrowserWindows(sessionId, profilePath);
  } else {
    await killSessionBrowserPosix(profilePath);
    removeSessionSingletonLocks(profilePath);
  }
  logWhatsApp(
    `[${sessionId}] encerramento best-effort do browser órfão da sessão (tokens preservados)`
  );
}

// ===== Single-flight / mutex por sessionId =====
// Garante que NUNCA há dois create() WPPConnect concorrentes para a mesma
// sessão: connect/recover-qr reutilizam a Promise de inicialização em curso em
// vez de iniciar outra create(). Também serializa operações de ciclo de vida
// (destroy + create) de cada sessão.
const sessionCreatePromises = new Map();
const sessionLifecycleChains = new Map();

function runSessionLifecycleOp(sessionId, op) {
  const previous = sessionLifecycleChains.get(sessionId) || Promise.resolve();
  const next = previous.then(op, op);
  sessionLifecycleChains.set(sessionId, next);
  next.catch(() => {});
  return next;
}

function startSessionCreate(sessionId) {
  const inFlight = sessionCreatePromises.get(sessionId);
  if (inFlight) return inFlight;
  const creating = createSession(sessionId).finally(() => {
    if (sessionCreatePromises.get(sessionId) === creating) {
      sessionCreatePromises.delete(sessionId);
    }
  });
  sessionCreatePromises.set(sessionId, creating);
  return creating;
}

// Interrompe uma inicialização em curso (invalida callbacks pelo initGen e
// fecha o browser criado) e a aguarda assentar. Usado pelo recover-qr antes de
// recriar a sessão, para que o create() antigo não colida com o novo.
async function cancelInFlightCreate(state) {
  const inFlight = sessionCreatePromises.get(state.sessionId);
  if (!inFlight) return;
  state.initGen += 1;
  clearQrWatchdog(state);
  try {
    await inFlight;
  } catch {
    // o fluxo interno já trata erros; aqui só garantimos que assentou
  }
}

const sessions = new Map();

function getSessionState(sessionId) {
  let state = sessions.get(sessionId);
  if (!state) {
    state = createSessionState(sessionId);
    sessions.set(sessionId, state);
  }
  return state;
}

function setSessionState(state, next) {
  state.connectionState = next;
  if (next === 'connected') {
    if (!state.connectedAt) state.connectedAt = new Date().toISOString();
    state.lastSyncAt = new Date().toISOString();
  } else if (next === 'disconnected') {
    state.connectedAt = null;
  }
}

// ===== Cadastro de contas (metadados persistidos, nunca tokens/cookies) =====
let accounts = [];

function loadAccounts() {
  try {
    if (existsSync(ACCOUNTS_FILE)) {
      const parsed = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'));
      if (Array.isArray(parsed.accounts)) {
        accounts = parsed.accounts.filter(
          (acc) => acc && typeof acc.sessionId === 'string'
        );
      }
    }
  } catch (err) {
    logError(`falha ao ler contas: ${String((err && err.message) || err)}`);
  }
  if (!accounts.some((acc) => acc.sessionId === DOMNEX_DEFAULT_SESSION)) {
    accounts.unshift({
      sessionId: DOMNEX_DEFAULT_SESSION,
      name: 'Conta principal',
      phone: null,
      createdAt: new Date().toISOString(),
    });
  }
}

function saveAccounts() {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(
      ACCOUNTS_FILE,
      JSON.stringify({ accounts }, null, 2)
    );
  } catch (err) {
    logError(`falha ao persistir contas: ${String((err && err.message) || err)}`);
  }
}

function nextSessionId() {
  let index = 2;
  const taken = new Set(accounts.map((acc) => acc.sessionId));
  while (index <= 99) {
    const candidate = `domnex-${String(index).padStart(2, '0')}`;
    if (!taken.has(candidate)) return candidate;
    index += 1;
  }
  return `domnex-${Date.now().toString(36)}`;
}

function buildAccountView() {
  return accounts.map((acc) => {
    const st = getSessionState(acc.sessionId);
    return {
      id: acc.sessionId,
      sessionId: acc.sessionId,
      name: st.deviceName || acc.name || acc.sessionId,
      phone: st.devicePhone || acc.phone || null,
      status: st.connectionState,
      connectedAt: st.connectedAt,
      lastSyncAt: st.lastSyncAt,
      createdAt: acc.createdAt,
    };
  });
}

async function refreshHostDevice(state) {
  if (!state.client || typeof state.client.getHostDevice !== 'function') return;
  try {
    const info = await state.client.getHostDevice();
    const raw = info || {};
    const me = raw.me || {};
    let number = state.devicePhone;
    let name = state.deviceName;
    if (me.id && me.id.user) {
      number = String(me.id.user);
    } else if (raw.hostPhoneNumber) {
      number = String(raw.hostPhoneNumber);
    }
    if (me.pushname || me.name) {
      name = String(me.pushname || me.name);
    } else if (me.id && me.id.user) {
      name = String(me.id.user);
    }
    if (number || name) {
      state.devicePhone = number;
      state.deviceName = name;
      const meta = accounts.find((acc) => acc.sessionId === state.sessionId);
      if (meta) {
        if (name) meta.name = name;
        if (number) meta.phone = number;
        saveAccounts();
      }
    }
  } catch {
    // dados de dispositivo são opcionais
  }
}

// ===== Eventos de mensagem por sessão =====
function registerMessage(state, message) {
  if (!message) return;
  try {
    const isGroup = !!message.isGroupMsg;
    const entry = {
      id:
        (message.id && (message.id._serialized || message.id.id)) ||
        message.id ||
        null,
      chatId: message.chatId || message.from || null,
      isGroup,
      from: message.author || message.from || null,
      type: message.type || 'unknown',
      text:
        typeof message.body === 'string'
          ? message.body.slice(0, 1000)
          : message.isMedia
          ? 'media'
          : null,
      timestamp: message.t
        ? new Date(message.t * 1000).toISOString()
        : new Date().toISOString(),
    };
    state.recentMessages.push(entry);
    if (state.recentMessages.length > RECENT_LIMIT) {
      state.recentMessages.splice(0, state.recentMessages.length - RECENT_LIMIT);
    }
    logInfo(
      `evento de mensagem [${entry.type}] de ${entry.from} em ${entry.chatId}${
        isGroup ? ' (grupo)' : ''
      } (${state.sessionId})`
    );
  } catch (err) {
    logError('falha ao registrar evento de mensagem');
  }
}

// ===== Monitor de Grupo Mãe → Grupo Filho (replicação de texto) =====
// Escopo inicial: apenas mensagens de TEXTO novas no Grupo Mãe, replicadas
// para o primeiro grupo filho configurado da MESMA conta.
const MONITOR_CONFIG_PATH = path.join(DATA_DIR, 'monitor-config.json');
// Template padrão do monitor: linhas com variáveis sem dado REAL são removidas
// pelo renderer (nada é inventado; {{link}} sempre presente após a conversão).
const DEFAULT_MONITOR_TEMPLATE = [
  'Oferta encontrada',
  '',
  '{{produto}}',
  'De {{preco_original}} por apenas {{preco}}',
  'Desconto: {{desconto}}%',
  '',
  '{{link}}',
].join('\n');

const DEFAULT_MONITOR_CONFIG = {
  enabled: false,
  parentGroupId: null,
  childGroupIds: [],
  childGroupDelays: {},
  childLastSendAt: {},
  template: null,
  messageMode: 'dynamic',
  tenantId: null,
  lastMessageAt: null,
  lastMessageId: null,
  lastSendAt: null,
  lastSendMessageId: null,
  lastError: null,
};
let monitorBySession = {};

function monitorLog(sessionId, message) {
  console.log(`[Monitor ${sessionId}] ${new Date().toISOString()} ${message}`);
}

function monitorErrorLog(sessionId, message) {
  console.error(
    `[Monitor ${sessionId}] ${new Date().toISOString()} ${message}`
  );
}

function getAccountMonitor(sessionId) {
  if (!monitorBySession[sessionId]) {
    monitorBySession[sessionId] = { ...DEFAULT_MONITOR_CONFIG };
  }
  return monitorBySession[sessionId];
}

function formatMonitorPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

// Renderiza o template do monitor preenchendo SOMENTE variáveis com dado REAL.
// Linhas sem nenhuma variável preenchida são removidas (nada é inventado).
function buildMonitorOfferMessage(template, offer = {}) {
  const source =
    typeof template === 'string' && template.trim()
      ? template
      : DEFAULT_MONITOR_TEMPLATE;
  const values = {
    produto:
      typeof offer.productName === 'string' && offer.productName
        ? offer.productName
        : '',
    preco: offer.price != null ? formatMonitorPrice(offer.price) : '',
    preco_original:
      offer.originalPrice != null ? formatMonitorPrice(offer.originalPrice) : '',
    desconto:
      offer.discountPercentage != null && offer.discountPercentage > 0
        ? String(offer.discountPercentage)
        : '',
    link: typeof offer.affiliateUrl === 'string' ? offer.affiliateUrl : '',
  };
  const out = [];
  for (const raw of source.split(/\r?\n/)) {
    let hasToken = false;
    let hasData = false;
    const rendered = raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      hasToken = true;
      const value = Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : '';
      if (value) hasData = true;
      return value;
    });
    const line = rendered.replace(/[ \t]+/g, ' ').trim();
    if (hasToken && !hasData) continue;
    if (line) out.push(line);
  }
  return out.join('\n').trim();
}

// Extrai de uma URL de produto Shopee os ids do item (formato -i.<n>.<n>) e o
// slug real do título. Retorna null quando não é um link de produto.
function extractShopeeUrlProductRef(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  let shopId = null;
  let itemId = null;
  let slug = '';

  const slugMatch = parsed.pathname.match(/-i\.(\d+)\.(\d+)/i);
  if (slugMatch) {
    shopId = Number(slugMatch[1]);
    itemId = Number(slugMatch[2]);
    slug = parsed.pathname.replace(/-i\.\d+\.\d+.*$/i, '');
  } else {
    const productMatch = parsed.pathname.match(/\/product\/(\d+)\/(\d+)(?:\/|$)/i);
    if (productMatch) {
      shopId = Number(productMatch[1]);
      itemId = Number(productMatch[2]);
      slug = String(itemId);
    }
  }

  if (!Number.isFinite(itemId)) return null;

  const itemTokens = new Set([itemId]);
  if (Number.isFinite(shopId)) itemTokens.add(shopId);

  if (slug && slug !== String(itemId)) {
    slug = slug.replace(/^\/+|\/+$/g, '');
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // keep raw slug
    }
    slug = slug.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return {
    itemTokens,
    itemId,
    shopId,
    slug: (slug || String(itemId)).slice(0, 60),
  };
}

// Resolve dados REAIS do produto pela Affiliate Open API. Busca pelo slug do
// título e confirma pelo itemId presente na URL (itemId única por produto).
// Se a API não devolver o produto, retorna null (seguro, nada é inventado).
async function fetchShopeePublicProduct(ref) {
  if (
    !ref ||
    !Number.isFinite(Number(ref.shopId)) ||
    !Number.isFinite(Number(ref.itemId))
  ) {
    return null;
  }

  const shopId = Number(ref.shopId);
  const itemId = Number(ref.itemId);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const endpoint =
      `https://shopee.com.br/api/v4/item/get?itemid=${encodeURIComponent(itemId)}` +
      `&shopid=${encodeURIComponent(shopId)}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
        Referer: `https://shopee.com.br/product/${shopId}/${itemId}`,
      },
    });
    if (!response.ok) return null;

    const json = await response.json();
    const item =
      (json && json.data && typeof json.data === 'object' ? json.data : null) ||
      (json && json.item) ||
      (json && json.data && json.data.item) ||
      null;
    if (!item || typeof item !== 'object') return null;

    const money = (value) => {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return null;
      return n >= 100000 ? n / 100000 : n;
    };

    const price = money(item.price ?? item.price_min ?? item.price_max);
    const originalPrice = money(
      item.price_before_discount ??
      item.price_min_before_discount ??
      item.price_max_before_discount
    );

    let discountPercentage = null;
    if (typeof item.discount === 'string') {
      const match = item.discount.match(/(\d+(?:[.,]\d+)?)\s*%/);
      if (match) discountPercentage = Number(match[1].replace(',', '.'));
    } else if (Number.isFinite(Number(item.discount))) {
      discountPercentage = Number(item.discount);
    }
    if (
      !Number.isFinite(discountPercentage) &&
      price !== null &&
      originalPrice !== null &&
      originalPrice > price
    ) {
      discountPercentage =
        Math.round((1 - price / originalPrice) * 10000) / 100;
    }

    const imageToken =
      typeof item.image === 'string' && item.image.trim()
        ? item.image.trim()
        : '';
    const imageUrl = imageToken
      ? /^https?:\/\//i.test(imageToken)
        ? imageToken
        : `https://down-br.img.susercontent.com/file/${imageToken}`
      : '';

    return {
      itemId,
      shopId,
      productName:
        typeof item.name === 'string' ? item.name.trim() : '',
      shopName: '',
      imageUrl,
      price,
      originalPrice:
        originalPrice !== null && price !== null && originalPrice > price
          ? originalPrice
          : null,
      discountPercentage:
        Number.isFinite(discountPercentage) && discountPercentage > 0
          ? Math.round(discountPercentage * 100) / 100
          : 0,
      commissionAmount: null,
      commissionRate: null,
      sales: Number(item.historical_sold ?? item.sold ?? 0) || 0,
      rating:
        item.item_rating && Number.isFinite(Number(item.item_rating.rating_star))
          ? Number(item.item_rating.rating_star)
          : null,
      productLink: `https://shopee.com.br/product/${shopId}/${itemId}`,
      offerLink: '',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveMonitorProduct(shopeeClient, rawUrl) {
  const ref = extractShopeeUrlProductRef(rawUrl);
  if (!ref) return null;

  const searches = [];
  if (ref.slug) searches.push(ref.slug);
  if (ref.itemId != null) searches.push(String(ref.itemId));

  for (const keyword of [...new Set(searches)]) {
    try {
      const result = await shopeeClient.productOfferV2({
        keyword,
        limit: 50,
      });
      const nodes = Array.isArray(result.nodes) ? result.nodes : [];
      for (const node of nodes) {
        const product = normalizeShopeeNode(node);
        if (!product || product.itemId === null || product.itemId === undefined) {
          continue;
        }
        if (Number(product.itemId) === Number(ref.itemId)) return product;
      }
    } catch {
      // Continue to the next safe fallback.
    }
  }

  // Affiliate API can legitimately omit products from productOfferV2.
  // Fall back to Shopee's public product detail using exact shopId/itemId
  // extracted from the canonical redirect. No fabricated commercial data.
  return fetchShopeePublicProduct(ref);
}

// Converte UMA única URL Shopee do Grupo Mãe em oferta afiliada do tenant do
// monitor e envia a TODOS os Grupos Filhos. Nunca encaminha o link cru.
async function handleMonitorAffiliateLink(sessionId, cfg, sourceUrl, msgId) {
  const tenantId =
    typeof cfg.tenantId === 'string' && cfg.tenantId.trim()
      ? cfg.tenantId.trim()
      : '';
  if (!tenantId) {
    cfg.lastMessageAt = new Date().toISOString();
    cfg.lastMessageId = msgId;
    cfg.lastError = 'Monitor sem tenantId configurado.';
    saveMonitorConfig();
    monitorLog(sessionId, `processamento ignorado: ${cfg.lastError}`);
    return;
  }
  const credentials = affiliateStore.getShopeeApiCredentials(tenantId);
  if (!credentials) {
    cfg.lastMessageAt = new Date().toISOString();
    cfg.lastMessageId = msgId;
    cfg.lastError = `Sem credenciais Shopee válidas para o tenant ${tenantId}.`;
    saveMonitorConfig();
    monitorLog(sessionId, `processamento ignorado: ${cfg.lastError}`);
    return;
  }

  monitorLog(sessionId, 'link Shopee detectado');
  monitorLog(sessionId, `conversão afiliada iniciada (tenant=${tenantId})`);

  const client = createShopeeApiClient({
    credentials: {
      appId: credentials.appId,
      secret: credentials.secret,
      apiUrl: credentials.apiUrl,
    },
  });
  const view = affiliateStore.getShopeePublicView(tenantId) || {};
  const subIds = Array.isArray(view.subIds) ? view.subIds : [];

  let affiliateUrl = null;
  let resolvedSourceUrl = null;
  try {
    const result = await client.generateShortLink({ sourceUrl, subIds });
    affiliateUrl = result && result.affiliateUrl ? result.affiliateUrl : null;
    resolvedSourceUrl =
      result && typeof result.resolvedSourceUrl === 'string'
        ? result.resolvedSourceUrl
        : null;
  } catch (err) {
    cfg.lastMessageAt = new Date().toISOString();
    cfg.lastMessageId = msgId;
    cfg.lastError = `Falha na conversão do link: ${sanitizeSendError(err)}`;
    saveMonitorConfig();
    monitorLog(sessionId, `processamento falhou: ${cfg.lastError}`);
    return;
  }
  if (!affiliateUrl) {
    cfg.lastMessageAt = new Date().toISOString();
    cfg.lastMessageId = msgId;
    cfg.lastError = 'Conversão não retornou link afiliado.';
    saveMonitorConfig();
    monitorLog(sessionId, `processamento falhou: ${cfg.lastError}`);
    return;
  }
  monitorLog(sessionId, 'link afiliado gerado');

  const children = Array.isArray(cfg.childGroupIds)
    ? cfg.childGroupIds.filter((id) => id && id !== cfg.parentGroupId)
    : [];
  if (!children.length) {
    cfg.lastMessageAt = new Date().toISOString();
    cfg.lastMessageId = msgId;
    cfg.lastError = 'Nenhum grupo filho configurado.';
    saveMonitorConfig();
    monitorLog(sessionId, `processamento falhou: ${cfg.lastError}`);
    return;
  }

  const offer = { affiliateUrl };
  const productSourceUrl = resolvedSourceUrl || sourceUrl;
  const product = await resolveMonitorProduct(client, productSourceUrl);
  if (product) {
    offer.itemId = product.itemId;
    offer.productName = product.productName;
    offer.price = product.price;
    offer.originalPrice = product.originalPrice;
    offer.discountPercentage = product.discountPercentage;
    offer.rating = product.rating;
    offer.sales = product.sales;
    offer.shopName = product.shopName;
    offer.commissionAmount = product.commissionAmount;
    offer.imageUrl = product.imageUrl;
    monitorLog(sessionId, 'produto resolvido');
  } else {
    monitorLog(sessionId, 'produto não resolvido pela API (apenas link)');
  }

  const messageMode = cfg.messageMode === 'custom' ? 'custom' : 'dynamic';
  const message =
    messageMode === 'custom'
      ? buildMonitorOfferMessage(cfg.template, offer)
      : buildDynamicMonitorOfferMessage(offer, { seed: offer.itemId || msgId });
  monitorLog(sessionId, `mensagem de oferta montada (modo=${messageMode})`);
  if (!message) {
    cfg.lastMessageAt = new Date().toISOString();
    cfg.lastMessageId = msgId;
    cfg.lastError = 'Não foi possível montar a mensagem da oferta.';
    saveMonitorConfig();
    monitorLog(sessionId, `processamento falhou: ${cfg.lastError}`);
    return;
  }

  const st = getSessionState(sessionId);
  if (!st.client || typeof st.client.sendText !== 'function') {
    cfg.lastMessageAt = new Date().toISOString();
    cfg.lastMessageId = msgId;
    cfg.lastError = 'Cliente WhatsApp indisponível.';
    saveMonitorConfig();
    monitorErrorLog(sessionId, `erro no envio: ${cfg.lastError}`);
    return;
  }

  monitorLog(sessionId, `enviando para ${children.length} grupos filhos`);
  const sentIds = [];
  if (!cfg.childLastSendAt || typeof cfg.childLastSendAt !== 'object') {
    cfg.childLastSendAt = {};
  }
  for (const child of children) {
    try {
      const delaySeconds = Math.min(
        3600,
        Math.max(
          0,
          Number(
            cfg.childGroupDelays && cfg.childGroupDelays[child] != null
              ? cfg.childGroupDelays[child]
              : 30
          ) || 0
        )
      );
      const previousSend = Date.parse(cfg.childLastSendAt[child] || '');
      if (delaySeconds > 0 && Number.isFinite(previousSend)) {
        const remainingMs = delaySeconds * 1000 - (Date.now() - previousSend);
        if (remainingMs > 0) {
          monitorLog(
            sessionId,
            `anti-flood aguardando ${Math.ceil(remainingMs / 1000)}s para ${child}`
          );
          await sleep(remainingMs);
        }
      }

      const result = offer.imageUrl
        ? await sendProductWithMedia(st.client, child, message, offer.imageUrl)
        : await st.client.sendText(child, message);
      const sentId =
        (result && result.messageId) ||
        (result && result.id && (result.id._serialized || result.id.id)) ||
        null;
      if (sentId) sentIds.push(sentId);
      else if (result) sentIds.push('sent-without-id');
      if (result) cfg.childLastSendAt[child] = new Date().toISOString();
    } catch (err) {
      cfg.lastError = String((err && err.message) || err);
      monitorErrorLog(sessionId, `erro no envio para ${child}: ${cfg.lastError}`);
    }
  }

  const now = new Date().toISOString();
  cfg.lastMessageAt = now;
  cfg.lastMessageId = msgId;
  cfg.lastSendAt = now;
  cfg.lastSendMessageId = sentIds[0] || null;
  cfg.lastError = null;
  saveMonitorConfig();
  monitorLog(
    sessionId,
    `envio concluído (${sentIds.length}/${children.length} grupos filhos)`
  );
}

function loadMonitorConfig() {
  try {
    if (existsSync(MONITOR_CONFIG_PATH)) {
      const parsed = JSON.parse(readFileSync(MONITOR_CONFIG_PATH, 'utf8'));
      if (parsed && typeof parsed === 'object' && parsed.sessions) {
        monitorBySession = parsed.sessions;
      } else if (parsed && typeof parsed === 'object') {
        // Migração do formato antigo (config global única) para domnex-main.
        monitorBySession = { [DOMNEX_DEFAULT_SESSION]: parsed };
      }
    }
  } catch (err) {
    logError(
      `[Monitor] falha ao ler configuração: ${String((err && err.message) || err)}`
    );
  }
  for (const key of Object.keys(monitorBySession)) {
    monitorBySession[key] = {
      ...DEFAULT_MONITOR_CONFIG,
      ...monitorBySession[key],
    };
  }
  // Feature flag manual. Default false. Só ativa explicitamente para o teste
  // (aplica-se à conta principal; outras contas exigem POST /api/monitor).
  const flag = process.env.MONITOR_GROUP_ENABLED;
  if (flag === 'true') getAccountMonitor(DOMNEX_DEFAULT_SESSION).enabled = true;
  else if (flag === 'false') getAccountMonitor(DOMNEX_DEFAULT_SESSION).enabled = false;
  const totalSessions = Object.keys(monitorBySession).length;
  monitorLog(
    `configuração carregada para ${totalSessions} conta(s)`
  );
}

function saveMonitorConfig() {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(
      MONITOR_CONFIG_PATH,
      JSON.stringify({ sessions: monitorBySession }, null, 2)
    );
  } catch (err) {
    monitorErrorLog(
      DOMNEX_DEFAULT_SESSION,
      `falha ao persistir configuração: ${String((err && err.message) || err)}`
    );
  }
}

function isMonitorActive(cfg) {
  return Boolean(cfg.enabled && cfg.parentGroupId);
}

// Deduplicação em memória — opera SOMENTE sobre messageId real/canônico
// (garantido pelo normalizeMonitorMessage em monitorPipeline.js).
const monitorDeduper = createMonitorDeduper();

// Cache de admins do Grupo Mãe em memória (evita consultar o grupo a cada
// mensagem). Refrescado a cada poucos minutos.
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;
const groupAdminsCache = new Map();

function canonicalNumber(id) {
  if (!id) return null;
  const num = String(id)
    .split('@')[0]
    .replace(/\D/g, '');
  return num || null;
}

// Retorna o conjunto de números (formato canônico) dos administradores do
// Grupo Mãe, com cache. `null` indica falha na consulta (falha segura).
async function ensureGroupAdminNumbers(client, sessionId, groupId) {
  const key = `${sessionId}|${groupId}`;
  const cached = groupAdminsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.numbers;

  let participants;
  try {
    participants = await client.getGroupAdmins(groupId);
  } catch (err) {
    monitorErrorLog(
      sessionId,
      `falha ao consultar admins do grupo mãe ${groupId}: ${String((err && err.message) || err)}`
    );
    return null;
  }

  // Mantém aliases equivalentes de identidade para cada admin (PN e LID).
  const numbers = new Set();
  for (const participant of participants || []) {
    const raw =
      (participant && participant._serialized) ||
      (participant && participant.id && participant.id._serialized) ||
      (participant && participant.id) ||
      participant;
    const serialized =
      typeof raw === 'string'
        ? raw
        : raw && raw._serialized
        ? raw._serialized
        : raw && raw.user && raw.server
        ? `${raw.user}@${raw.server}`
        : null;

    const direct = canonicalNumber(serialized || raw);
    if (direct) numbers.add(direct);

    if (
      serialized &&
      /@(c\.us|lid)$/i.test(serialized) &&
      typeof client.getPnLidEntry === 'function'
    ) {
      try {
        const mapping = await client.getPnLidEntry(serialized);
        for (const wid of [mapping && mapping.phoneNumber, mapping && mapping.lid]) {
          const alias =
            (wid && wid._serialized) ||
            (wid && wid.user && wid.server ? `${wid.user}@${wid.server}` : null);
          const aliasNumber = canonicalNumber(alias);
          if (aliasNumber) numbers.add(aliasNumber);
        }
      } catch {
        // Alias opcional; identidade direta continua válida.
      }
    }
  }

  groupAdminsCache.set(key, {
    numbers,
    expiresAt: Date.now() + ADMIN_CACHE_TTL_MS,
  });
  monitorLog(sessionId, `admins do grupo mãe ${groupId} carregados (${participants?.length || 0}; aliases=${numbers.size})`);
  return numbers;
}

// Replica mensagens de TEXTO novas do Grupo Mãe para o primeiro grupo filho.
// Não reprocessa histórico nem emite disparo em massa.
async function handleMonitorReplication(sessionId, message) {
  const cfg = getAccountMonitor(sessionId);
  try {
    if (!message) return;
    if (!isMonitorActive(cfg)) {
      monitorLog(sessionId, 'mensagem recebida (monitor desativado - ignorada)');
      return;
    }

    const canonical = normalizeMonitorMessage(message);
    if (!canonical) {
      monitorLog(sessionId, 'evento auxiliar/incompleto ignorado');
      return;
    }

    const parentId = cfg.parentGroupId;
    if (canonical.chatId !== parentId) {
      monitorLog(sessionId, 'origem ignorada: não é o grupo mãe configurado');
      return;
    }

    const msgId = canonical.messageId;
    if (monitorDeduper.isDuplicate(msgId)) {
      monitorLog(sessionId, 'mensagem duplicada ignorada');
      return;
    }
    // Reserva antes de qualquer await: o mesmo messageId nunca atravessa o
    // pipeline simultaneamente em duas entregas do listener.
    monitorDeduper.remember(msgId);
    monitorLog(sessionId, 'mensagem canônica recebida');
    monitorLog(sessionId, 'grupo mãe validado');

    const monClient = getSessionState(sessionId).client;
    if (!monClient || typeof monClient.getGroupAdmins !== 'function') {
      monitorLog(sessionId, 'cliente indisponível - autor não autorizado (falha segura)');
      return;
    }

    const adminNumbers = await ensureGroupAdminNumbers(monClient, sessionId, parentId);
    if (!adminNumbers) {
      monitorLog(sessionId, 'não foi possível confirmar admins - autor não autorizado');
      return;
    }
    // Compara autor e admins por aliases PN/LID. Alguns payloads reais do
    // onAnyMessage entregam `author` apenas como número (sem @lid/@c.us).
    const actorAliases = new Set();
    const actorId = canonical.authorId;
    const actorText = actorId ? String(actorId).trim() : '';
    const directActor = canonicalNumber(actorText);
    if (directActor) actorAliases.add(directActor);

    const actorLookupIds = [];
    if (actorText) {
      actorLookupIds.push(actorText);
      if (!actorText.includes('@') && /^\d+$/.test(actorText)) {
        actorLookupIds.push(`${actorText}@lid`, `${actorText}@c.us`);
      }
    }

    if (typeof monClient.getPnLidEntry === 'function') {
      for (const lookupId of actorLookupIds) {
        if (!/@(c\.us|lid)$/i.test(lookupId)) continue;
        try {
          const mapping = await monClient.getPnLidEntry(lookupId);
          for (const wid of [mapping && mapping.phoneNumber, mapping && mapping.lid]) {
            const alias =
              (wid && wid._serialized) ||
              (wid && wid.user && wid.server ? `${wid.user}@${wid.server}` : null);
            const aliasNumber = canonicalNumber(alias);
            if (aliasNumber) actorAliases.add(aliasNumber);
          }
        } catch {
          // Tenta o próximo formato equivalente sem autorizar por aproximação.
        }
      }
    }

    const authorized = [...actorAliases].some((id) => adminNumbers.has(id));
    if (!authorized) {
      monitorLog(sessionId, `autor não autorizado (aliases=${actorAliases.size}, admins=${adminNumbers.size})`);
      return;
    }
    monitorLog(sessionId, 'autor validado (admin do grupo mãe)');

    const route = resolveMonitorRoute(canonical.body);
    if (route.route === 'shopee' && route.url) {
      monitorLog(sessionId, 'link Shopee detectado');
      await handleMonitorAffiliateLink(sessionId, cfg, route.url, msgId);
      return;
    }

    const children = Array.isArray(cfg.childGroupIds)
      ? cfg.childGroupIds.filter((id) => id && id !== parentId)
      : [];
    if (!children.length) {
      cfg.lastMessageAt = new Date().toISOString();
      cfg.lastMessageId = msgId;
      cfg.lastError = 'Nenhum grupo filho configurado.';
      saveMonitorConfig();
      monitorErrorLog(sessionId, `erro no envio: ${cfg.lastError}`);
      return;
    }

    // Replicação comum preserva o comportamento existente: primeiro filho.
    const target = children[0];
    const st = getSessionState(sessionId);
    if (!st.client || typeof st.client.sendText !== 'function') {
      cfg.lastMessageAt = new Date().toISOString();
      cfg.lastMessageId = msgId;
      cfg.lastError = 'Cliente WhatsApp indisponível.';
      saveMonitorConfig();
      monitorErrorLog(sessionId, `erro no envio: ${cfg.lastError}`);
      return;
    }

    let sent = null;
    try {
      sent = await st.client.sendText(target, canonical.body);
    } catch (err) {
      cfg.lastMessageAt = new Date().toISOString();
      cfg.lastMessageId = msgId;
      cfg.lastError = String((err && err.message) || err);
      saveMonitorConfig();
      monitorErrorLog(sessionId, `erro no envio: ${cfg.lastError}`);
      return;
    }

    const sentId =
      (sent && sent.id && (sent.id._serialized || sent.id.id)) || null;
    const now = new Date().toISOString();
    cfg.lastMessageAt = now;
    cfg.lastMessageId = msgId;
    cfg.lastSendAt = now;
    cfg.lastSendMessageId = sentId;
    cfg.lastError = null;
    saveMonitorConfig();
    monitorLog(sessionId, 'replicação concluída com sucesso');
  } catch (err) {
    monitorErrorLog(
      sessionId,
      `falha no processamento: ${String((err && err.message) || err)}`
    );
  }
}

// ===== Mapeamento de estados do WPPConnect =====
// generation: callbacks de inicializações anteriores são ignorados para que
// um statusFind antigo nunca sobrescreva um estado posterior (ex.: connected).
function handleStatusFind(state, generation, statusSession) {
  if (state.initGen !== generation) return;
  const s = String(statusSession || '');
  switch (s) {
    case 'inChat':
    case 'isLogged':
      if (state.connectionState !== 'connected') {
        state.qrCode = null;
        setSessionState(state, 'connecting');
      }
      logWhatsApp(`[${state.sessionId}] sessão autenticada no WhatsApp Web`);
      break;
    case 'qrReadSuccess':
      state.qrCode = null;
      if (state.connectionState !== 'connected') setSessionState(state, 'connecting');
      logWhatsApp(`[${state.sessionId}] QR autenticado - aguardando cliente pronto`);
      break;
    case 'notLogged':
      enterAwaitingQr(state);
      break;
    case 'qrReadError':
    case 'qrReadFail':
      enterAwaitingQr(state);
      logWhatsApp(`[${state.sessionId}] leitura de QR falhou - novo QR gerado`);
      break;
    case 'phoneNotConnected':
      if (state.connectionState !== 'connected') setSessionState(state, 'connecting');
      break;
    case 'autocloseCalled':
    case 'browserClose':
    case 'serverClose':
    case 'disconnectedMobile':
      state.qrCode = null;
      setSessionState(state, 'disconnected');
      logWhatsApp(`[${state.sessionId}] sessão encerrada/fechada (${s})`);
      break;
    default:
      logWhatsApp(`[${state.sessionId}] statusFind não mapeado: ${statusSession}`);
  }
}

// Estados intermediários válidos NUNCA viram ERROR.
function handleSocketState(state, generation, socketState) {
  if (state.initGen !== generation) return;
  const s = String(socketState || '').toUpperCase();
  switch (s) {
    case 'CONNECTED':
      state.initRetries = 0;
      state.qrCode = null;
      clearQrWatchdog(state);
      setSessionState(state, 'connected');
      void refreshHostDevice(state);
      break;
    case 'OPENING':
    case 'PAIRING':
      if (state.connectionState !== 'connected') setSessionState(state, 'connecting');
      break;
    case 'UNPAIRED':
    case 'UNPAIRED_IDLE':
      enterAwaitingQr(state);
      break;
    case 'CONFLICT':
      state.lastError = 'CONFLICT - sessão aberta em outro dispositivo';
      setSessionState(state, 'error');
      logError(`[WhatsApp ${state.sessionId}] conflito de sessão: ${state.lastError}`);
      break;
    case 'TIMEOUT':
      setSessionState(state, 'reconnecting');
      logWhatsApp(`[${state.sessionId}] timeout na conexão - reconectando`);
      break;
    case 'PROXYBLOCK':
    case 'SMB_TOS_BLOCK':
    case 'TOS_BLOCK':
    case 'DEPRECATED_VERSION':
    case 'UNLAUNCHED':
      state.lastError = `${s} - WhatsApp Web bloqueado/indisponível`;
      setSessionState(state, 'error');
      logError(`[WhatsApp ${state.sessionId}] estado de bloqueio: ${s}`);
      break;
    default:
      logWhatsApp(`[${state.sessionId}] status não mapeado: ${socketState}`);
  }
  logWhatsApp(`[${state.sessionId}] estado = ${state.connectionState}`);
}

// Callback de QR: só armazena QR REAL (não vazio). QR vazio/indefinido
// ("QR (undefined)" / sessão não pareada sem canvas) NUNCA é exposto como QR
// válido — mantém o estado intermediário até a vigilância decidir o desfecho.
function decodeQr(state, generation, base64Qr) {
  if (state.initGen !== generation) return;
  const data = typeof base64Qr === 'string' ? base64Qr : '';
  if (!data) {
    logError(
      `[WhatsApp ${state.sessionId}] QR vazio/indefinido (init #${generation}) - sem canvas de QR - estado intermediário mantido`
    );
    return;
  }
  state.qrCode = data;
  state.qrLastDataAt = Date.now();
  logWhatsApp(`[${state.sessionId}] QR real gerado (init #${generation}) - pronto para escaneamento`);
  enterAwaitingQr(state);
}

// Falha real do ciclo create(). Priorização de estados (tempo não pode
// sobrescrever conectividade posterior):
//   1) connected posterior vence qualquer timeout anterior;
//   2) QR real vence (awaiting_qr);
//   3) falha: encerra o browser órfão desta sessão (SEM apagar tokens) e
//      reinicializa UMA vez para obter um cliente utilizável. Esgotou ->
//      error + recuperação ("Tentar novamente").
async function handleCreateFailure(state, generation, err) {
  const msg = String((err && err.message) || err);
  logError(`[WhatsApp ${state.sessionId}] falha ao iniciar sessão (init #${generation}): ${msg}`);
  if (state.initGen !== generation) return state;

  if (state.connectionState === 'connected') {
    state.starting = false;
    return state;
  }
  if (state.qrCode && state.qrCode.length) {
    state.starting = false;
    enterAwaitingQr(state);
    return state;
  }

  clearQrWatchdog(state);

  if (state.initRetries >= 1) {
    state.starting = false;
    state.client = null;
    state.lastError = msg;
    state.qrCode = null;
    setSessionState(state, 'error');
    await ensureSessionBrowserStopped(state.sessionId);
    logError(
      `[WhatsApp ${state.sessionId}] tentativas de inicialização esgotadas - estado de erro + "Tentar novamente" disponível`
    );
    return state;
  }

  state.initRetries += 1;
  state.starting = false;
  state.lastError = msg;
  state.qrCode = null;
  setSessionState(state, 'reconnecting');
  logWhatsApp(
    `[${state.sessionId}] reiniciando sessão após falha de init (tentativa ${state.initRetries}/1) - browser órfão encerrado, tokens preservados`
  );
  await ensureSessionBrowserStopped(state.sessionId);
  await sleep(1500);
  if (state.initGen !== generation) return state;
  if (state.qrCode && state.qrCode.length) {
    enterAwaitingQr(state);
    return state;
  }
  return createSession(state.sessionId);
}

async function createSession(sessionId) {
  const state = getSessionState(sessionId);
  // Double-start guard: uma única inicialização por sessão por vez.
  if (state.starting) return state;
  if (state.client) {
    // Cliente vivo (conectado/conectando/QR) é reutilizado.
    if (
      state.connectionState !== 'disconnected' &&
      state.connectionState !== 'error'
    ) {
      logWhatsApp(
        `[${sessionId}] cliente existente em uso (${state.connectionState}) - reutilizando`
      );
      return state;
    }
    // Cliente obsoleto em estado final/down fica preso em memória. Encerra
    // antes de reconectar para permitir uma nova sessão sem apagar tokens.
    logWhatsApp(
      `[${sessionId}] cliente obsoleto (${state.connectionState}) - encerrando para reconectar`
    );
    await destroySession(sessionId);
    if (state.starting) return state;
  }
  // Garante que nenhum browser órfão segura o userDataDir desta sessão antes
  // de (re)iniciar. Idempotente: encerra somente Chromium deste perfil em
  // qualquer estado (error/disconnected) e remove apenas locks transitórios.
  await ensureSessionBrowserStopped(sessionId);
  const generation = state.initGen + 1;
  state.initGen = generation;
  state.starting = true;
  state.qrCode = null;
  state.qrLastDataAt = null;
  state.lastError = null;
  setSessionState(state, 'connecting');
  startQrStuckWatchdog(state);

  logWhatsApp(`[${sessionId}] connect solicitado - iniciando sessão WPPConnect (init #${generation})`);

  try {
    const created = await create({
      session: sessionId,
      folderNameToken: SESSION_DIR,
      catchQR: (base64Qr) => decodeQr(state, generation, base64Qr),
      statusFind: (statusSession) => handleStatusFind(state, generation, statusSession),
      headless: true,
      logQR: false,
      puppeteerOptions: {
        executablePath: CHROME_PATH,
        headless: true,
        // Contêiner roda como root (Railway/Docker): sem --no-sandbox o
        // Chromium recusa abrir ("Running as root without --no-sandbox").
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      // Mantem a sessao viva em segundo plano mesmo sem QR escaneado.
      autoClose: 0,
    });

    // Uma inicialização mais nova começou enquanto esta terminava: descarta
    // este cliente para não deixar DOIS browsers no mesmo perfil.
    if (state.initGen !== generation) {
      try {
        if (typeof created.close === 'function') await created.close();
      } catch {
        // ignorado
      }
      return state;
    }

    state.client = created;
    state.starting = false;
    state.initRetries = 0;
    logWhatsApp(`[${sessionId}] cliente inicializado (init #${generation})`);

    // A v2.3.3 resolve o create() já com a sessão conectada quando há tokens
    // válidos. Confirma com getConnectionState e só então marca CONNECTED.
    let socketState = null;
    if (typeof created.getConnectionState === 'function') {
      try {
        socketState = await created.getConnectionState();
      } catch (err) {
        logError(
          `[WhatsApp ${sessionId}] getConnectionState falhou: ${String((err && err.message) || err)}`
        );
      }
    }
    if (socketState) {
      handleSocketState(state, generation, socketState);
    } else {
      state.qrCode = null;
      setSessionState(state, 'connected');
      void refreshHostDevice(state);
    }

    registerSessionListeners(state, generation);
  } catch (err) {
    if (state.initGen === generation) {
      await handleCreateFailure(state, generation, err);
    }
  }
  return state;
}

// Listeners reais da API v2.3.3 (sem client.on).
// Cada registro é isolado: falha em listener NUNCA derruba a sessão.
// generation: callbacks do cliente anterior (inicialização obsoleta) são
// descartados para nunca corromperem o estado da inicialização corrente.
function registerSessionListeners(state, generation) {
  const sessionClient = state.client;
  if (sessionClient && typeof sessionClient.onMessage === 'function') {
    try {
      sessionClient.onMessage((message) => {
        if (state.initGen !== generation) return;
        registerMessage(state, message);
      });
      logWhatsApp(`[${state.sessionId}] listener onMessage registrado`);
    } catch (err) {
      logError(
        `[WhatsApp ${state.sessionId}] falha ao registrar onMessage: ${String((err && err.message) || err)}`
      );
    }
  } else {
    logError(`[WhatsApp ${state.sessionId}] onMessage indisponível no cliente`);
  }

  // O monitor usa onAnyMessage (oficial): sem ele, mensagens enviadas pela
  // própria conta (fromMe) não são entregues pelo onMessage.
  const monitorListenerFn =
    sessionClient && typeof sessionClient.onAnyMessage === 'function'
      ? sessionClient.onAnyMessage.bind(sessionClient)
      : sessionClient && typeof sessionClient.onMessage === 'function'
      ? sessionClient.onMessage.bind(sessionClient)
      : null;
  if (monitorListenerFn) {
    try {
      monitorListenerFn((message) => {
        if (state.initGen !== generation) return;
        void handleMonitorReplication(state.sessionId, message);
      });
      logWhatsApp(
        `[${state.sessionId}] listener monitor (Grupo Mãe → Filho) registrado (${
          typeof sessionClient.onAnyMessage === 'function'
            ? 'onAnyMessage'
            : 'onMessage'
        })`
      );
    } catch (err) {
      monitorErrorLog(
        state.sessionId,
        `falha ao registrar listener do monitor: ${String((err && err.message) || err)}`
      );
    }
  } else {
    monitorErrorLog(state.sessionId, 'listener do monitor indisponível no cliente');
  }

  if (sessionClient && typeof sessionClient.onStateChange === 'function') {
    try {
      sessionClient.onStateChange((socketState) => {
        if (state.initGen !== generation) return;
        handleSocketState(state, generation, socketState);
      });
      logWhatsApp(`[${state.sessionId}] listener onStateChange registrado`);
    } catch (err) {
      logError(
        `[WhatsApp ${state.sessionId}] falha ao registrar onStateChange: ${String((err && err.message) || err)}`
      );
    }
  } else {
    logError(`[WhatsApp ${state.sessionId}] onStateChange indisponível no cliente`);
  }
}

async function destroySession(sessionId) {
  const state = getSessionState(sessionId);
  clearQrWatchdog(state);
  const current = state.client;
  state.client = null;
  if (current) {
    if (typeof current.logout === 'function') {
      try {
        await current.logout();
      } catch {
        // ignorado: logout pode falhar se a sessao ja caiu
      }
    }
    if (typeof current.close === 'function') {
      try {
        await current.close();
      } catch {
        // ignorado
      }
    }
  }
  // Best-effort: garante que nenhum browser Chromium desta sessão ficou vivo
  // (encerra somente os processos do userDataDir, aguarda o término e remove
  // apenas locks transitórios). Não apaga tokens/cookies da sessão.
  await ensureSessionBrowserStopped(sessionId);
  await sleep(1500);
  state.qrCode = null;
  state.starting = false;
  setSessionState(state, 'disconnected');
  state.lastError = null;
  logWhatsApp(`[${sessionId}] sessão destruída`);
}

// Limpa SOMENTE o dado de autenticação WhatsApp da sessão informada (dados
// mortos que bloqueiam o QR: "Session Unpaired" + QR undefined). SEMPRE após
// encerrar o browser da sessão. NÃO remove a conta/metadados e NÃO toca nas
// demais sessões. Se o browser ainda estiver aberto, o rm falha (EPERM) e o
// erro é registrado (a UI ainda verá o estado via vigilância do QR).
function clearSessionAuthData(sessionId) {
  const profileDir = path.join(SESSION_DIR, sessionId);
  const targets = [
    'Default/Local Storage',
    'Default/Session Storage',
    'Default/IndexedDB',
    'Default/Service Worker',
  ];
  const removed = [];
  for (const rel of targets) {
    const target = path.join(profileDir, rel);
    try {
      if (existsSync(target)) {
        rmSync(target, { recursive: true, force: true });
        removed.push(rel);
      }
    } catch (err) {
      logError(
        `[WhatsApp ${sessionId}] falha ao limpar auth de ${rel}: ${String((err && err.message) || err)}`
      );
    }
  }
  const tokenFile = path.join(SESSION_DIR, `${sessionId}.data.json`);
  try {
    if (existsSync(tokenFile)) {
      rmSync(tokenFile, { force: true });
      removed.push('<session>.data.json');
    }
  } catch (err) {
    logError(
      `[WhatsApp ${sessionId}] falha ao remover arquivo de token: ${String((err && err.message) || err)}`
    );
  }
  if (removed.length) {
    logWhatsApp(`[${sessionId}] auth WhatsApp morta removida (${removed.join(', ')})`);
  }
}

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      const allowed = new Set([
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://[::1]:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://[::1]:5173',
      ]);
      const productionOrigin = 'https://pulseflow.vercel.app';
      const previewOriginPattern = /^https:\/\/pulseflow-[a-z0-9-]+-domnex-tech\.vercel\.app$/i;
      if (
        !origin ||
        allowed.has(origin) ||
        origin === productionOrigin ||
        previewOriginPattern.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Origem nao permitida pelo CORS'));
      }
    },
  })
);

app.use(express.json({ limit: '50kb' }));

// Valida o sessionId da rota (ou usa a conta principal por padrão).
function resolveSessionId(req, res, next) {
  const raw = req.params.sessionId || DOMNEX_DEFAULT_SESSION;
  if (!SESSION_ID_PATTERN.test(raw)) {
    return res.status(400).json({ ok: false, error: 'sessionId invalido.' });
  }
  req.resolvedSessionId = raw;
  next();
}

// Identifica o tenant (cliente/org) autenticado. Sem auth ainda, o tenant é
// passado por X-Tenant-Id; a validação de existência garante isolamento.
function resolveTenant(req, res, next) {
  const raw = String(req.headers['x-tenant-id'] || '').trim();
  if (!raw) {
    return res
      .status(401)
      .json({ ok: false, error: 'Tenant não identificado (falta X-Tenant-Id).' });
  }
  if (!SESSION_ID_PATTERN.test(raw)) {
    return res.status(400).json({ ok: false, error: 'tenantId invalido.' });
  }
  req.tenantId = raw;
  next();
}

// Endpoints tenant-scoped exigem tenant cadastrado (404 se desconhecido).
function requireTenantExists(req, res, next) {
  if (!affiliateStore.tenantExists(req.tenantId)) {
    return res
      .status(404)
      .json({ ok: false, error: 'Tenant não cadastrado.', tenant: req.tenantId });
  }
  next();
}

function makeRequireConnected(sessionId) {
  return (req, res, next) => {
    const state = getSessionState(sessionId);
    if (!state.client) {
      return res
        .status(409)
        .json({ ok: false, error: 'Nao existe uma sessao ativa.', session: sessionId });
    }
    if (state.connectionState !== 'connected') {
      return res.status(409).json({
        ok: false,
        error: 'Sessao nao esta conectada.',
        session: sessionId,
        status: state.connectionState,
      });
    }
    next();
  };
}

// Versão para rotas com :sessionId (usa o id resolvido pelo middleware anterior).
function requireConnectedSession(req, res, next) {
  const sessionId = req.resolvedSessionId;
  const state = getSessionState(sessionId);
  if (!state.client) {
    return res
      .status(409)
      .json({ ok: false, error: 'Nao existe uma sessao ativa.', session: sessionId });
  }
  if (state.connectionState !== 'connected') {
    return res.status(409).json({
      ok: false,
      error: 'Sessao nao esta conectada.',
      session: sessionId,
      status: state.connectionState,
    });
  }
  next();
}

function statusPayload(state) {
  return {
    ok: true,
    session: state.sessionId,
    status: state.connectionState,
    connected: state.connectionState === 'connected',
    qrPending: state.connectionState === 'awaiting_qr',
    error: state.lastError,
  };
}

// Converte ids do WPPConnect ({ user, server, _serialized }) em string.
function toSerializedId(id) {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (id._serialized) return id._serialized;
  const user = id.user || (id.id && id.id.user);
  const server = id.server || (id.id && id.id.server);
  if (user && server) return `${user}@${server}`;
  return null;
}

// Normaliza um grupo real da API em { id, name, participantCount, isGroup }.
// Campos ausentes viram null. Nenhum valor é inventado.
function normalizeGroupSource(raw) {
  const chat = raw || {};
  const id = toSerializedId(chat.id);
  if (!id || !/^[^\s@]+@g\.us$/i.test(id)) return null;
  const lower = id.toLowerCase();
  if (lower === 'status@broadcast' || id.includes('@broadcast') || id.includes('@newsletter')) {
    return null;
  }

  const meta = chat.groupMetadata || null;
  let participantCount = null;
  if (meta && Number.isFinite(meta.size)) {
    participantCount = meta.size;
  } else if (meta && Array.isArray(meta.participants)) {
    participantCount = meta.participants.length;
  }

  const rawName =
    (typeof chat.name === 'string' && chat.name.trim()) ||
    (typeof chat.formattedTitle === 'string' && chat.formattedTitle.trim()) ||
    (meta && typeof meta.subject === 'string' && meta.subject.trim());
  const name = rawName || null;

  return { id, name, participantCount, isGroup: true };
}

async function listGroupsForClient(sessionClient) {
  let source = [];
  // API real da versão instalada. getAllGroups garante os metadados do grupo
  // (participants/size). listChats é o substituto moderno, getAllChats o fallback.
  if (typeof sessionClient.getAllGroups === 'function') {
    source = await sessionClient.getAllGroups(false);
  } else if (typeof sessionClient.listChats === 'function') {
    const chats = await sessionClient.listChats({ onlyGroups: true });
    source = chats || [];
  } else if (typeof sessionClient.getAllChats === 'function') {
    const chats = await sessionClient.getAllChats();
    source = (chats || []).filter((chat) => chat && chat.isGroup);
  } else {
    throw new Error('Nenhuma API de consulta de grupos disponível.');
  }

  return (Array.isArray(source) ? source : [])
    .map(normalizeGroupSource)
    .filter((group) => group && group.id)
    .sort((a, b) => {
      const an = a.name || '';
      const bn = b.name || '';
      return an.localeCompare(bn, 'pt-BR') || a.id.localeCompare(b.id);
    });
}

function validateSendBody(req, res) {
  const { groupId, message } = req.body || {};
  if (typeof groupId !== 'string' || !groupId.trim()) {
    res.status(400).json({ ok: false, error: 'groupId e obrigatorio.' });
    return null;
  }
  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ ok: false, error: 'message e obrigatorio.' });
    return null;
  }
  if (message.trim().length > 4096) {
    res.status(400).json({
      ok: false,
      error: 'Mensagem muito longa (max. 4096 caracteres).',
    });
    return null;
  }
  return { groupId: groupId.trim(), message: message.trim() };
}

async function sendViaClient(sessionClient, groupId, message) {
  const sent = await sessionClient.sendText(groupId, message);
  const messageId =
    (sent && sent.id && (sent.id._serialized || sent.id.id)) || null;
  return messageId;
}

// Envio com a foto REAL do produto (imageUrl vem somente do productOfferV2 da
// Shopee, nunca do corpo da requisição). Usa sendImage por URL do WPPConnect.
// Se a mídia falhar, cai para envio apenas de texto, sem perder o envio.
async function sendProductWithMedia(sessionClient, groupId, message, imageUrl) {
  const isUrl =
    typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl.trim());
  if (isUrl) {
    try {
      const sent = await sessionClient.sendImage(
        groupId,
        imageUrl.trim(),
        'produto.png',
        message
      );
      const messageId =
        (sent && sent.id && (sent.id._serialized || sent.id.id)) || null;
      logWhatsApp(`[auto-search] envio com mídia OK (${groupId})`);
      return { messageId, media: 'sent' };
    } catch (err) {
      logWhatsApp(
        `[auto-search] mídia falhou (${groupId}); enviando apenas texto: ${sanitizeSendError(err)}`
      );
    }
  } else {
    logWhatsApp(`[auto-search] sem imageUrl real; enviando apenas texto (${groupId})`);
  }
  const sent = await sessionClient.sendText(groupId, message);
  const messageId =
    (sent && sent.id && (sent.id._serialized || sent.id.id)) || null;
  return { messageId, media: 'text' };
}

// Erro de envio sanitizado (nunca expõe segredos do tenant/Shopee).
function sanitizeSendError(err) {
  const raw =
    err && typeof err.message === 'string'
      ? err.message
      : String((err && err.toString && err.toString()) || '');
  if (!raw || !raw.trim()) return 'erro desconhecido.';
  return raw.trim().slice(0, 300);
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'domnex-whatsapp-server', session: DOMNEX_DEFAULT_SESSION });
});

// ===== Contas (multisessão) =====
app.get('/api/whatsapp/accounts', (req, res) => {
  res.json({ ok: true, accounts: buildAccountView(), maxAccounts: MAX_ACCOUNTS });
});

app.post('/api/whatsapp/accounts', (req, res) => {
  if (MAX_ACCOUNTS > 0 && accounts.length >= MAX_ACCOUNTS) {
    return res.status(409).json({
      ok: false,
      error: `Limite de ${MAX_ACCOUNTS} contas atingido (definido por MAX_WHATSAPP_ACCOUNTS).`,
    });
  }
  const { sessionId, name } = req.body || {};
  let sid = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : nextSessionId();
  if (!SESSION_ID_PATTERN.test(sid)) {
    return res.status(400).json({ ok: false, error: 'sessionId invalido.' });
  }
  if (accounts.some((acc) => acc.sessionId === sid)) {
    return res.status(409).json({ ok: false, error: 'Conta já existente.' });
  }
  accounts.push({
    sessionId: sid,
    name:
      typeof name === 'string' && name.trim() ? name.trim() : `Conta ${sid}`,
    phone: null,
    createdAt: new Date().toISOString(),
  });
  saveAccounts();
  // Estado da sessão passa a existir (ainda desconectado; QR após connect).
  getSessionState(sid);
  logWhatsApp(`conta adicionada: ${sid}`);
  res.json({ ok: true, account: buildAccountView().find((a) => a.sessionId === sid) });
});

// ===== Remoção definitiva de uma sessão (conta + estado + monitor + tokens) =====
app.delete(
  '/api/whatsapp/:sessionId/account',
  resolveSessionId,
  async (req, res) => {
    const sessionId = req.resolvedSessionId;
    if (sessionId === DOMNEX_DEFAULT_SESSION) {
      return res.status(409).json({
        ok: false,
        error: 'A conta principal (domnex-main) não pode ser removida.',
      });
    }
    try {
      await destroySession(sessionId);
    } catch (err) {
      logError(
        `[WhatsApp ${sessionId}] falha ao encerrar sessão antes da remoção: ${String(
          (err && err.message) || err
        )}`
      );
    }
    sessions.delete(sessionId);
    accounts = accounts.filter((acc) => acc.sessionId !== sessionId);
    saveAccounts();
    if (monitorBySession[sessionId]) {
      delete monitorBySession[sessionId];
      saveMonitorConfig();
    }
    const tokenDir = path.join(SESSION_DIR, sessionId);
    if (existsSync(tokenDir)) {
      try {
        rmSync(tokenDir, { recursive: true, force: true });
        logWhatsApp(`[${sessionId}] pasta de tokens removida`);
      } catch (err) {
        logError(
          `[WhatsApp ${sessionId}] falha ao remover tokens: ${String(
            (err && err.message) || err
          )}`
        );
      }
    }
    logWhatsApp(`conta removida: ${sessionId}`);
    res.json({ ok: true, session: sessionId, status: 'removed' });
  }
);

// ===== Rotas com sessão explícita (:sessionId) =====
app.get(
  '/api/whatsapp/:sessionId/status',
  resolveSessionId,
  (req, res) => {
    res.json(statusPayload(getSessionState(req.resolvedSessionId)));
  }
);

app.post(
  '/api/whatsapp/:sessionId/connect',
  resolveSessionId,
  (req, res) => {
    const sessionId = req.resolvedSessionId;
    logWhatsApp(`[${sessionId}] connect solicitado`);
    const state = getSessionState(sessionId);
    if (state.starting) {
      return res.json({ ok: true, session: sessionId, status: 'connecting' });
    }
    if (
      state.client &&
      state.connectionState !== 'disconnected' &&
      state.connectionState !== 'error'
    ) {
      logWhatsApp(`[${sessionId}] sessão existente encontrada - reutilizando cliente`);
      return res.json({ ok: true, session: sessionId, status: state.connectionState });
    }
    // Single-flight/mutex: se já houver init em andamento para esta sessão,
    // reutiliza a PROMISE em curso em vez de iniciar outro create().
    void runSessionLifecycleOp(sessionId, () => startSessionCreate(sessionId));
    res.json({ ok: true, session: sessionId, status: 'connecting' });
  }
);

app.get(
  '/api/whatsapp/:sessionId/qr',
  resolveSessionId,
  (req, res) => {
    const qr = getSessionState(req.resolvedSessionId).qrCode;
    if (!qr) {
      return res.status(204).json({ qr: null });
    }
    res.json({ qr });
  }
);

// Recupera o QR travado: encerra a sessão órfã (logout + close), remove a
// auth morta que bloqueia o canvas de QR e recria a sessão -> QR REAL novo.
app.post(
  '/api/whatsapp/:sessionId/recover-qr',
  resolveSessionId,
  async (req, res) => {
    const sessionId = req.resolvedSessionId;
    try {
      // Mutex por sessão: serializa destroy+create para nunca haver DOIS
      // create() WPPConnect concorrentes / colisão com recover anterior.
      await runSessionLifecycleOp(sessionId, async () => {
        const state = getSessionState(sessionId);
        // Interrompe e aguarda qualquer init WPPConnect em andamento para que
        // o create() antigo não colida com o novo (libera o userDataDir).
        await cancelInFlightCreate(state);
        await destroySession(sessionId);
        clearSessionAuthData(sessionId);
        await startSessionCreate(sessionId);
      });
      logWhatsApp(`[${sessionId}] recuperação de QR solicitada (nova sessão real iniciada)`);
      res.json({ ok: true, session: sessionId, status: 'connecting' });
    } catch (err) {
      logError(
        `[WhatsApp ${sessionId}] falha ao recuperar QR: ${String((err && err.message) || err)}`
      );
      res.status(500).json({ ok: false, error: 'Falha ao gerar novo QR. Tente novamente.' });
    }
  }
);

app.get(
  '/api/whatsapp/:sessionId/account',
  resolveSessionId,
  requireConnectedSession,
  async (req, res) => {
    const sessionId = req.resolvedSessionId;
    try {
      const state = getSessionState(sessionId);
      if (state.client && typeof state.client.getHostDevice === 'function') {
        await refreshHostDevice(state);
      }
      res.json({
        ok: true,
        account: {
          id: sessionId,
          sessionId,
          number: state.devicePhone,
          name: state.deviceName,
          connectionStatus: state.connectionState,
          connectedAt: state.connectedAt,
          lastSyncAt: state.lastSyncAt,
        },
      });
    } catch (err) {
      logError(`[WhatsApp ${sessionId}] falha ao obter dados da conta`);
      res.status(500).json({ ok: false, error: 'Falha ao obter dados da conta.' });
    }
  }
);

app.post(
  '/api/whatsapp/:sessionId/disconnect',
  resolveSessionId,
  async (req, res) => {
    const sessionId = req.resolvedSessionId;
    try {
      await destroySession(sessionId);
      res.json({ ok: true, status: 'disconnected' });
    } catch (err) {
      logError(`[WhatsApp ${sessionId}] falha ao desconectar`);
      const state = getSessionState(sessionId);
      state.lastError = String((err && err.message) || err);
      setSessionState(state, 'error');
      res.status(500).json({ ok: false, error: 'Falha ao desconectar.' });
    }
  }
);

app.get(
  '/api/whatsapp/:sessionId/groups',
  resolveSessionId,
  requireConnectedSession,
  async (req, res) => {
    const sessionId = req.resolvedSessionId;
    try {
      const state = getSessionState(sessionId);
      const groups = await listGroupsForClient(state.client);
      logWhatsApp(`[${sessionId}] grupos reais carregados = ${groups.length}`);
      res.json({
        ok: true,
        session: sessionId,
        groups,
        total: groups.length,
      });
    } catch (err) {
      logError(`[WhatsApp ${sessionId}] falha ao listar grupos: ${String((err && err.message) || err)}`);
      res.status(500).json({ ok: false, error: 'Falha ao listar grupos.' });
    }
  }
);

app.post(
  '/api/whatsapp/:sessionId/send',
  resolveSessionId,
  requireConnectedSession,
  async (req, res) => {
    const sessionId = req.resolvedSessionId;
    const payload = validateSendBody(req, res);
    if (!payload) return;
    try {
      const state = getSessionState(sessionId);
      const messageId = await sendViaClient(state.client, payload.groupId, payload.message);
      logInfo(`[${sessionId}] mensagem enviada para ${payload.groupId} (id ${messageId})`);
      res.json({ ok: true, messageId, timestamp: new Date().toISOString() });
    } catch (err) {
      logError(`[WhatsApp ${sessionId}] falha no envio de mensagem`);
      res.status(500).json({ ok: false, error: 'Falha no envio.' });
    }
  }
);

app.get(
  '/api/whatsapp/:sessionId/messages/recent',
  resolveSessionId,
  (req, res) => {
    const state = getSessionState(req.resolvedSessionId);
    res.json({ ok: true, messages: state.recentMessages.slice(-50).reverse() });
  }
);

// ===== Rotas legadas (compatibilidade, sempre a conta principal) =====
app.get('/api/whatsapp/status', (req, res) => {
  res.json(statusPayload(getSessionState(DOMNEX_DEFAULT_SESSION)));
});

app.post('/api/whatsapp/connect', (req, res) => {
  const sessionId = DOMNEX_DEFAULT_SESSION;
  logWhatsApp(`[${sessionId}] connect solicitado`);
  const state = getSessionState(sessionId);
  if (state.starting) {
    return res.json({ ok: true, session: sessionId, status: 'connecting' });
  }
  if (
    state.client &&
    state.connectionState !== 'disconnected' &&
    state.connectionState !== 'error'
  ) {
    logWhatsApp(`[${sessionId}] sessão existente encontrada - reutilizando cliente`);
    return res.json({ ok: true, session: sessionId, status: state.connectionState });
  }
  void runSessionLifecycleOp(sessionId, () => startSessionCreate(sessionId));
  res.json({ ok: true, session: sessionId, status: 'connecting' });
});

app.get('/api/whatsapp/qr',
  (req, res) => {
    const qr = getSessionState(DOMNEX_DEFAULT_SESSION).qrCode;
    if (!qr) {
      return res.status(204).json({ qr: null });
    }
    res.json({ qr });
  }
);

app.post('/api/whatsapp/recover-qr', async (req, res) => {
  try {
    const sessionId = DOMNEX_DEFAULT_SESSION;
    await runSessionLifecycleOp(sessionId, async () => {
      const state = getSessionState(sessionId);
      await cancelInFlightCreate(state);
      await destroySession(sessionId);
      clearSessionAuthData(sessionId);
      await startSessionCreate(sessionId);
    });
    logWhatsApp(`[${sessionId}] recuperação de QR solicitada (rota legada)`);
    res.json({ ok: true, session: sessionId, status: 'connecting' });
  } catch (err) {
    logError(`[WhatsApp] falha ao recuperar QR: ${String((err && err.message) || err)}`);
    res.status(500).json({ ok: false, error: 'Falha ao gerar novo QR. Tente novamente.' });
  }
});

app.get('/api/whatsapp/account', makeRequireConnected(DOMNEX_DEFAULT_SESSION), async (req, res) => {
  try {
    const state = getSessionState(DOMNEX_DEFAULT_SESSION);
    if (state.client && typeof state.client.getHostDevice === 'function') {
      await refreshHostDevice(state);
    }
    res.json({
      ok: true,
      account: {
        id: state.sessionId,
        sessionId: state.sessionId,
        number: state.devicePhone,
        name: state.deviceName,
        connectionStatus: state.connectionState,
        connectedAt: state.connectedAt,
        lastSyncAt: state.lastSyncAt,
      },
    });
  } catch (err) {
    logError('[WhatsApp] falha ao obter dados da conta');
    res.status(500).json({ ok: false, error: 'Falha ao obter dados da conta.' });
  }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    await destroySession(DOMNEX_DEFAULT_SESSION);
    res.json({ ok: true, status: 'disconnected' });
  } catch (err) {
    logError('[WhatsApp] falha ao desconectar');
    const state = getSessionState(DOMNEX_DEFAULT_SESSION);
    state.lastError = String((err && err.message) || err);
    setSessionState(state, 'error');
    res.status(500).json({ ok: false, error: 'Falha ao desconectar.' });
  }
});

app.get('/api/whatsapp/groups', makeRequireConnected(DOMNEX_DEFAULT_SESSION), async (req, res) => {
  try {
    const state = getSessionState(DOMNEX_DEFAULT_SESSION);
    const groups = await listGroupsForClient(state.client);
    logWhatsApp(`[${DOMNEX_DEFAULT_SESSION}] grupos reais carregados = ${groups.length}`);
    res.json({ ok: true, groups, total: groups.length });
  } catch (err) {
    logError(`[WhatsApp] falha ao listar grupos: ${String((err && err.message) || err)}`);
    res.status(500).json({ ok: false, error: 'Falha ao listar grupos.' });
  }
});

app.post('/api/whatsapp/send', makeRequireConnected(DOMNEX_DEFAULT_SESSION), async (req, res) => {
  const payload = validateSendBody(req, res);
  if (!payload) return;
  try {
    const state = getSessionState(DOMNEX_DEFAULT_SESSION);
    const messageId = await sendViaClient(state.client, payload.groupId, payload.message);
    logInfo(`mensagem enviada para ${payload.groupId} (id ${messageId})`);
    res.json({ ok: true, messageId, timestamp: new Date().toISOString() });
  } catch (err) {
    logError('[WhatsApp] falha no envio de mensagem');
    res.status(500).json({ ok: false, error: 'Falha no envio.' });
  }
});

app.get('/api/whatsapp/messages/recent', (req, res) => {
  const state = getSessionState(DOMNEX_DEFAULT_SESSION);
  res.json({ ok: true, messages: state.recentMessages.slice(-50).reverse() });
});

// ===== Monitor (config por conta) =====
app.get('/api/monitor/status', (req, res) => {
  const sessionId =
    typeof req.query.sessionId === 'string' && req.query.sessionId.trim()
      ? req.query.sessionId.trim()
      : DOMNEX_DEFAULT_SESSION;
  const cfg = getAccountMonitor(sessionId);
  res.json({
    ok: true,
    session: sessionId,
    connected: getSessionState(sessionId).connectionState === 'connected',
    enabled: Boolean(cfg.enabled),
    parentGroupId: cfg.parentGroupId,
    childGroupIds: cfg.childGroupIds,
    lastMessageAt: cfg.lastMessageAt,
    lastMessageId: cfg.lastMessageId,
    lastSendAt: cfg.lastSendAt,
    lastSendMessageId: cfg.lastSendMessageId,
    lastError: cfg.lastError,
    template: cfg.template ?? DEFAULT_MONITOR_TEMPLATE,
    messageMode: cfg.messageMode === 'custom' ? 'custom' : 'dynamic',
    tenantId: cfg.tenantId ?? null,
  });
});

app.post('/api/monitor', (req, res) => {
  const {
    enabled,
    parentGroupId,
    childGroupIds,
    childGroupDelays,
    sessionId,
    template,
    messageMode,
    tenantId,
  } = req.body || {};
  const sid =
    typeof sessionId === 'string' && sessionId.trim()
      ? sessionId.trim()
      : DOMNEX_DEFAULT_SESSION;
  if (!SESSION_ID_PATTERN.test(sid)) {
    return res.status(400).json({ ok: false, error: 'sessionId invalido.' });
  }
  const cfg = getAccountMonitor(sid);

  if (typeof enabled === 'boolean') cfg.enabled = enabled;

  if (parentGroupId !== undefined) {
    if (parentGroupId === null || parentGroupId === '') {
      cfg.parentGroupId = null;
    } else if (
      typeof parentGroupId === 'string' &&
      /^[^\s@]+@g\.us$/i.test(parentGroupId)
    ) {
      cfg.parentGroupId = parentGroupId;
    } else {
      return res.status(400).json({ ok: false, error: 'parentGroupId invalido.' });
    }
  }

  if (childGroupIds !== undefined) {
    if (!Array.isArray(childGroupIds)) {
      return res
        .status(400)
        .json({ ok: false, error: 'childGroupIds deve ser uma lista.' });
    }
    const seen = new Set();
    const valid = childGroupIds.filter((id, index) => {
      if (typeof id !== 'string' || !/^[^\s@]+@g\.us$/i.test(id)) {
        return false;
      }
      if (id === cfg.parentGroupId) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    cfg.childGroupIds = valid;
  }

  if (childGroupDelays !== undefined) {
    const source =
      childGroupDelays && typeof childGroupDelays === 'object'
        ? childGroupDelays
        : {};
    const allowed = new Set(cfg.childGroupIds || []);
    const next = {};
    for (const [groupId, rawDelay] of Object.entries(source)) {
      if (!allowed.has(groupId)) continue;
      const delay = Number(rawDelay);
      if (!Number.isFinite(delay)) continue;
      next[groupId] = Math.min(3600, Math.max(0, Math.round(delay)));
    }
    cfg.childGroupDelays = next;
  }

  if (template !== undefined) {
    if (template === null || template === '') {
      cfg.template = null;
    } else if (typeof template === 'string' && template.length <= 4000) {
      cfg.template = template;
    } else {
      return res.status(400).json({ ok: false, error: 'template invalido.' });
    }
  }

  if (messageMode !== undefined) {
    if (messageMode === 'dynamic' || messageMode === 'custom') {
      cfg.messageMode = messageMode;
    } else {
      return res.status(400).json({ ok: false, error: 'messageMode invalido.' });
    }
  }

  if (tenantId !== undefined) {
    if (tenantId === null || tenantId === '') {
      cfg.tenantId = null;
    } else if (
      typeof tenantId === 'string' &&
      SESSION_ID_PATTERN.test(tenantId) &&
      affiliateStore.tenantExists(tenantId)
    ) {
      cfg.tenantId = tenantId;
    } else {
      return res.status(400).json({ ok: false, error: 'tenantId invalido.' });
    }
  }

  saveMonitorConfig();
  logInfo(
    `monitor atualizado (${sid}): enabled=${cfg.enabled} mãe=${
      cfg.parentGroupId || '—'
    } filho(s)=${cfg.childGroupIds.length} tenant=${cfg.tenantId || '—'}`
  );
  res.json({
    ok: true,
    session: sid,
    enabled: Boolean(cfg.enabled),
    parentGroupId: cfg.parentGroupId,
    childGroupIds: cfg.childGroupIds,
    template: cfg.template ?? DEFAULT_MONITOR_TEMPLATE,
    messageMode: cfg.messageMode === 'custom' ? 'custom' : 'dynamic',
    tenantId: cfg.tenantId ?? null,
  });
});

// ===== Credenciais de Afiliados por Tenant (multi-cliente) =====
// TODAS as rotas são scoped pelo tenant atual (X-Tenant-Id).
// GET → view 100% segura (nunca contém secret) com appId mascarado.
// POST → salva/atualiza credenciais Shopee do tenant autenticado.
// POST /test → teste de conexão real usando EXCLUSIVAMENTE credenciais do
//              tenant atual; retorna apenas status sanitizado.
app.get(
  '/api/affiliate/credentials/shopee',
  resolveTenant,
  requireTenantExists,
  (req, res) => {
    const view = affiliateStore.getShopeePublicView(req.tenantId);
    res.json({ ok: true, tenant: req.tenantId, credentials: view });
  }
);

app.post(
  '/api/affiliate/credentials/shopee',
  resolveTenant,
  (req, res) => {
    const body = req.body || {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'corpo inválido.' });
    }
    try {
      affiliateStore.putCredentials(req.tenantId, {
        shopee: body,
      });
      const view = affiliateStore.getShopeePublicView(req.tenantId);
      logInfo(`credenciais Shopee atualizadas (tenant=${req.tenantId})`);
      res.json({ ok: true, tenant: req.tenantId, credentials: view });
    } catch (err) {
      if (err instanceof EncryptionKeyMissingError) {
        return res.status(500).json({
          ok: false,
          error: 'Chave de encriptação (ENCRYPTION_KEY) não configurada. Segredo não persistido.',
        });
      }
      logError(
        `falha ao salvar credenciais Shopee (tenant=${req.tenantId}): ${String(
          (err && err.message) || err
        )}`
      );
      res.status(500).json({ ok: false, error: 'Falha ao salvar credenciais.' });
    }
  }
);

app.post(
  '/api/affiliate/credentials/shopee/test',
  resolveTenant,
  requireTenantExists,
  async (req, res) => {
    try {
      const sourceUrl =
        req.body && typeof req.body.sourceUrl === 'string'
          ? req.body.sourceUrl.trim()
          : undefined;
      const result = await affiliateStore.testShopee(req.tenantId, {
        sourceUrl,
      });
      res.json({ ok: true, tenant: req.tenantId, ...result });
    } catch (err) {
      logError(
        `falha no teste de credencial (tenant=${req.tenantId}): ${String(
          (err && err.message) || err
        )}`
      );
      res.status(500).json({ ok: false, error: 'Falha no teste de credencial.' });
    }
  }
);

// ===== Busca Automática (fonte real Shopee, tenant-scoped) =====
// GET → status da fonte real (configurada/habilitada) para o tenant.
// POST /run → executa a busca real (productOfferV2), aplica filtros e gera
//             short links afiliados (generateShortLink) para aprovados.
// Tudo com as credenciais do tenant; o frontend nunca chama a Shopee.
app.get('/api/affiliate/auto-search/config', resolveTenant, (req, res) => {
  const view = affiliateStore.getShopeePublicView(req.tenantId);
  res.json({
    ok: true,
    tenant: req.tenantId,
    config: {
      configured: view.configured,
      enabled: view.enabled,
      status: view.status,
      appIdMasked: view.appIdMasked,
      subIds: view.subIds,
    },
  });
});

app.post('/api/affiliate/auto-search/run', resolveTenant, async (req, res) => {
  try {
    const result = await runShopeeAutoSearch({
      tenantId: req.tenantId,
      store: affiliateStore,
      criteria: (req.body && req.body.criteria) || req.body || {},
    });
    if (result.ok === false) {
      return res.status(400).json({ ok: false, tenant: req.tenantId, ...result });
    }
    logInfo(
      `busca Shopee executada (tenant=${req.tenantId}): consultados=${result.consulted} aprovados=${result.qualified} links=${result.shortLinksGenerated}`
    );
    res.json({ ok: true, tenant: req.tenantId, ...result });
  } catch (err) {
    logError(
      `falha na busca Shopee (tenant=${req.tenantId}): ${String(
        (err && err.message) || err
      )}`
    );
    res.status(500).json({ ok: false, error: 'Falha na busca automática.' });
  }
});

// ===== Automações da Busca Automática (config por tenant, sem envio) =====
app.get('/api/affiliate/auto-search/automations', resolveTenant, (req, res) => {
  const automations = automationsStore.list(req.tenantId);
  res.json({ ok: true, tenant: req.tenantId, automations });
});

app.post('/api/affiliate/auto-search/automations', resolveTenant, (req, res) => {
  try {
    const automation = automationsStore.upsert(req.tenantId, req.body || {});
    logInfo(`automação criada (tenant=${req.tenantId}, id=${automation.id})`);
    res.json({ ok: true, tenant: req.tenantId, automation });
  } catch (err) {
    logError(
      `falha ao criar automação (tenant=${req.tenantId}): ${String(
        (err && err.message) || err
      )}`
    );
    res.status(500).json({ ok: false, error: 'Falha ao salvar automação.' });
  }
});

app.put(
  '/api/affiliate/auto-search/automations/:id',
  resolveTenant,
  (req, res) => {
    try {
      const current = automationsStore.get(req.tenantId, req.params.id);
      if (!current) {
        return res
          .status(404)
          .json({ ok: false, error: 'Automação não encontrada.', tenant: req.tenantId });
      }
      const automation = automationsStore.upsert(req.tenantId, {
        ...(req.body || {}),
        id: req.params.id,
      });
      logInfo(`automação atualizada (tenant=${req.tenantId}, id=${automation.id})`);
      res.json({ ok: true, tenant: req.tenantId, automation });
    } catch (err) {
      logError(
        `falha ao atualizar automação (tenant=${req.tenantId}): ${String(
          (err && err.message) || err
        )}`
      );
      res.status(500).json({ ok: false, error: 'Falha ao atualizar automação.' });
    }
  }
);

app.delete(
  '/api/affiliate/auto-search/automations/:id',
  resolveTenant,
  (req, res) => {
    const removed = automationsStore.remove(req.tenantId, req.params.id);
    if (!removed) {
      return res
        .status(404)
        .json({ ok: false, error: 'Automação não encontrada.', tenant: req.tenantId });
    }
    logInfo(`automação removida (tenant=${req.tenantId}, id=${req.params.id})`);
    res.json({ ok: true, tenant: req.tenantId, removed: true });
  }
);

// ===== Lista de Links (persistência real por tenant) =====
app.get('/api/affiliate/link-lists', resolveTenant, (req, res) => {
  res.json({ ok: true, tenant: req.tenantId, lists: linkListsStore.list(req.tenantId) });
});

app.post('/api/affiliate/link-lists', resolveTenant, (req, res) => {
  try {
    const list = linkListsStore.upsert(req.tenantId, req.body || {});
    logInfo(`lista de links criada (tenant=${req.tenantId}, id=${list.id})`);
    res.json({ ok: true, tenant: req.tenantId, list });
  } catch (err) {
    logError(`falha ao criar lista de links (tenant=${req.tenantId}): ${sanitizeSendError(err)}`);
    res.status(500).json({ ok: false, error: 'Falha ao salvar lista de links.' });
  }
});

app.delete('/api/affiliate/link-lists/:id', resolveTenant, (req, res) => {
  const removed = linkListsStore.remove(req.tenantId, req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });
  res.json({ ok: true, tenant: req.tenantId, removed: true });
});

app.post('/api/affiliate/link-lists/:id/links', resolveTenant, (req, res) => {
  const result = linkListsStore.addLinks(req.tenantId, req.params.id, req.body?.urls || []);
  if (!result) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });
  res.json({ ok: true, tenant: req.tenantId, list: result.list, added: result.added.length });
});

app.delete('/api/affiliate/link-lists/:id/links/:linkId', resolveTenant, (req, res) => {
  const result = linkListsStore.removeLink(req.tenantId, req.params.id, req.params.linkId);
  if (result === null) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });
  if (result === false) return res.status(404).json({ ok: false, error: 'Link não encontrado.' });
  res.json({ ok: true, tenant: req.tenantId, list: result });
});

// Processa de verdade os links pendentes da lista com a Affiliate Open API.
// Nesta etapa o pipeline valida Shopee e gera o short link afiliado oficial.
// Falha de API/credencial mantém o item pendente para permitir nova tentativa;
// URL fora da Shopee é marcada como inválida. Nenhum dado comercial é inventado.
app.post('/api/affiliate/link-lists/:id/process', resolveTenant, async (req, res) => {
  const tenantId = req.tenantId;
  const list = linkListsStore.get(tenantId, req.params.id);
  if (!list) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });

  const credentials = affiliateStore.getShopeeApiCredentials(tenantId);
  const view = affiliateStore.getShopeePublicView(tenantId);
  if (!credentials || !view.configured || view.enabled !== true) {
    return res.status(409).json({
      ok: false,
      error: 'Integração Shopee não está configurada e habilitada para este tenant.',
    });
  }

  const client = createShopeeApiClient({ credentials });
  const candidates = list.links.filter((item) => item.status === 'Pendente');
  let valid = 0;
  let invalid = 0;
  let failed = 0;

  for (const item of candidates) {
    linkListsStore.updateLink(tenantId, list.id, item.id, {
      status: 'Processando',
      processError: null,
    });

    if (!isShopeeUrl(item.url)) {
      invalid += 1;
      linkListsStore.updateLink(tenantId, list.id, item.id, {
        marketplace: null,
        affiliateUrl: null,
        status: 'Inválido',
        processError: 'URL não reconhecida como link da Shopee.',
        processedAt: new Date().toISOString(),
      });
      continue;
    }

    try {
      const generated = await client.generateShortLink({
        sourceUrl: item.url,
        subIds: Array.isArray(view.subIds) ? view.subIds : [],
      });
      valid += 1;
      linkListsStore.updateLink(tenantId, list.id, item.id, {
        marketplace: 'Shopee',
        affiliateUrl: generated.affiliateUrl,
        status: 'Válido',
        processError: null,
        processedAt: new Date().toISOString(),
      });
    } catch (err) {
      failed += 1;
      linkListsStore.updateLink(tenantId, list.id, item.id, {
        marketplace: 'Shopee',
        affiliateUrl: null,
        status: 'Pendente',
        processError: sanitizeSendError(err),
        processedAt: new Date().toISOString(),
      });
    }
  }

  const updated = linkListsStore.get(tenantId, list.id);
  logInfo(`lista processada (tenant=${tenantId}, id=${list.id}): válidos=${valid} inválidos=${invalid} falhas=${failed}`);
  res.json({
    ok: true,
    tenant: tenantId,
    list: updated,
    summary: { attempted: candidates.length, valid, invalid, failed },
  });
});

// ===== Envio manual real (1 produto, 1 grupo, conta salva na automação) =====
// FLUXO: automação salva → busca real → validações → mensagem com template → WPPConnect.
// Segurança: o produto/price/short link vêm da API (nunca do corpo da requisição);
// grupo é validado contra os grupos REAIS da sessão E contra os salvos na automação.
app.post(
  '/api/affiliate/auto-search/automations/:id/send',
  resolveTenant,
  async (req, res) => {
    const tenantId = req.tenantId;
    try {
      const automation = automationsStore.get(tenantId, req.params.id);
      if (!automation) {
        return res
          .status(404)
          .json({ ok: false, error: 'Automação não encontrada.', tenant: tenantId });
      }

      const raw = req.body || {};
      const groupId = typeof raw.groupId === 'string' ? raw.groupId.trim() : '';
      const itemId = Number(raw.itemId);
      if (!groupId) {
        return res.status(400).json({ ok: false, error: 'groupId e obrigatorio.' });
      }
      if (!Number.isFinite(itemId) || itemId < 0) {
        return res.status(400).json({ ok: false, error: 'itemId e obrigatorio.' });
      }

      const sessionId = String(automation.destination.accountId || '').trim();
      if (!sessionId) {
        return res
          .status(400)
          .json({ ok: false, error: 'A automação não possui conta WhatsApp de destino.' });
      }
      if (!automation.destination.groupIds.includes(groupId)) {
        return res.status(400).json({
          ok: false,
          error: 'O grupo selecionado não pertence aos grupos salvos na automação.',
        });
      }

      const state = getSessionState(sessionId);
      if (!state.client || state.connectionState !== 'connected') {
        return res.status(409).json({
          ok: false,
          error: `Conta WhatsApp ${sessionId} não está conectada (status real: ${state.connectionState}).`,
          status: state.connectionState,
        });
      }

      let realGroups = [];
      try {
        realGroups = await listGroupsForClient(state.client);
      } catch (err) {
        logError(
          `[auto-search] falha ao listar grupos reais para envio: ${sanitizeSendError(err)}`
        );
        return res
          .status(500)
          .json({ ok: false, error: 'Falha ao validar grupos reais da conta.' });
      }
      if (!Array.isArray(realGroups) || !realGroups.some((group) => group.id === groupId)) {
        return res.status(400).json({
          ok: false,
          error: 'O grupo selecionado não pertence aos grupos reais da conta WhatsApp.',
        });
      }

      // Re-executa a busca com os critérios reais da automação (fonte da verdade).
      const result = await runShopeeAutoSearch({
        tenantId,
        store: affiliateStore,
        criteria: {
          maxResults: automation.maxResults,
          priority: automation.priority,
          categoryId: automation.categories.general ? null : automation.categories.categoryId,
          filters: automation.filters,
        },
      });
      if (!result.ok) {
        return res
          .status(400)
          .json({ ok: false, error: result.error || 'Falha na busca automática.' });
      }

      const approved = (Array.isArray(result.products) ? result.products : []).filter(
        (product) => product && product.status === 'qualified'
      );
      if (approved.length === 0) {
        return res
          .status(400)
          .json({ ok: false, error: 'Nenhum produto aprovado com os filtros atuais.' });
      }
      const product = approved.find((candidate) => Number(candidate.itemId) === itemId);
      if (!product) {
        return res
          .status(400)
          .json({ ok: false, error: 'Produto aprovado não localizado na consulta atual.' });
      }
      if (!product.affiliateUrl) {
        return res.status(400).json({
          ok: false,
          error: product.linkError
            ? `Short link não gerado para este produto: ${product.linkError}`
            : 'Short link não gerado para este produto.',
        });
      }

      const message = buildMessageFromTemplate(automation.messageTemplate, product);
      if (!message.trim()) {
        return res.status(400).json({ ok: false, error: 'Template vazio — nada a enviar.' });
      }
      if (message.trim().length > 4096) {
        return res
          .status(400)
          .json({ ok: false, error: 'Mensagem muito longa (max. 4096 caracteres).' });
      }

      const recordBase = {
        tenantId,
        automationId: automation.id,
        sessionId,
        groupId,
        itemId,
        marketplace: 'Shopee',
        affiliateUrl: product.affiliateUrl,
        productName: product.productName,
      };

      try {
        const { messageId, media } = await sendProductWithMedia(
          state.client,
          groupId,
          message,
          product.imageUrl
        );
        const record = {
          ...recordBase,
          sentAt: new Date().toISOString(),
          status: 'sent',
          messageId,
          error: null,
        };
        autoSearchSendsStore.record(tenantId, record);
        logInfo(
          `[auto-search] envio real OK (tenant=${tenantId}, automation=${automation.id}, session=${sessionId}, group=${groupId}, item=${itemId}, media=${media}, msg=${messageId})`
        );
        res.json({ ok: true, tenant: tenantId, send: record, message });
      } catch (err) {
        const reason = sanitizeSendError(err);
        const record = {
          ...recordBase,
          sentAt: new Date().toISOString(),
          status: 'failed',
          messageId: null,
          error: reason,
        };
        autoSearchSendsStore.record(tenantId, record);
        logError(
          `[auto-search] envio FALHOU (tenant=${tenantId}, automation=${automation.id}, group=${groupId}): ${reason}`
        );
        res
          .status(500)
          .json({
            ok: false,
            error: reason ? `Falha no envio: ${reason}` : 'Falha no envio WhatsApp.',
            send: record,
          });
      }
    } catch (err) {
      logError(
        `[auto-search] falha ao preparar envio manual (tenant=${tenantId}): ${sanitizeSendError(err)}`
      );
      res.status(500).json({ ok: false, error: 'Falha ao preparar o envio.' });
    }
  }
);

app.get('/api/affiliate/auto-search/sends', resolveTenant, (req, res) => {
  res.json({ ok: true, tenant: req.tenantId, sends: autoSearchSendsStore.list(req.tenantId) });
});

// ===== Destinos reais (contas WhatsApp + grupos sincronizados) =====
// Tenant-scoped no transporte, mas as contas WhatsApp deste backend são
// compartilhadas; grupos NUNCA são fictícios: vêm do cliente conectado.
app.get('/api/affiliate/auto-search/destinations', resolveTenant, async (req, res) => {
  try {
    const accounts = [];
    for (const acc of buildAccountView()) {
      const entry = {
        id: acc.sessionId,
        name: acc.name,
        phone: acc.phone,
        status: acc.status,
        groups: [],
      };
      if (acc.status === 'connected') {
        try {
          const state = getSessionState(acc.sessionId);
          if (state.client) {
            entry.groups = await listGroupsForClient(state.client);
          }
        } catch (err) {
          logError(
            `[WhatsApp ${acc.sessionId}] falha ao listar grupos p/ destinos: ${String(
              (err && err.message) || err
            )}`
          );
        }
      }
      accounts.push(entry);
    }
    res.json({ ok: true, tenant: req.tenantId, accounts });
  } catch (err) {
    logError(
      `falha ao listar destinos (tenant=${req.tenantId}): ${String(
        (err && err.message) || err
      )}`
    );
    res.status(500).json({ ok: false, error: 'Falha ao listar destinos.' });
  }
});

app.use((err, req, res, next) => {
  logError(`erro nao tratado: ${String((err && err.message) || err)}`);
  res.status(500).json({ ok: false, error: 'Erro interno.' });
});

if (!existsSync(SESSION_DIR)) {
  mkdirSync(SESSION_DIR, { recursive: true });
}

loadAccounts();
loadMonitorConfig();

app.listen(PORT, HOST, () => {
  logInfo(`API escutando em http://${HOST}:${PORT}`);
  const restoreCandidates = accounts.filter((acc) =>
    existsSync(path.join(SESSION_DIR, acc.sessionId))
  );
  if (restoreCandidates.length > 0) {
    for (const acc of restoreCandidates) {
      logWhatsApp(`[${acc.sessionId}] sessão persistida detectada - restaurando em segundo plano`);
    }
    // Restaura sessões de forma distribuída para não travar várias páginas
    // do Chrome ao mesmo tempo.
    let delay = 0;
    for (const acc of restoreCandidates) {
      setTimeout(() => {
        void runSessionLifecycleOp(acc.sessionId, () => startSessionCreate(acc.sessionId));
      }, delay);
      delay += 8000;
    }
  } else {
    logWhatsApp('sem sessões persistidas - aguardando /connect');
  }
});