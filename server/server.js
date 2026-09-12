'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const { create } = require('@wppconnect-team/wppconnect');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');

const PORT = Number(process.env.PORT || 3001);
const HOST = '127.0.0.1';
const DOMNEX_DEFAULT_SESSION = 'domnex-main';
// Escopo da fase: suporte a 2 contas simultâneas.
const MAX_ACCOUNTS = 2;
const SESSION_DIR = path.join(__dirname, 'tokens');
const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const CHROME_PATH =
  process.env.WPP_CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RECENT_LIMIT = 200;

const SESSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

function logInfo(message) {
  console.log(`[info] ${new Date().toISOString()} ${message}`);
}

function logError(message) {
  console.error(`[error] ${new Date().toISOString()} ${message}`);
}

function logWhatsApp(message) {
  console.log(`[WhatsApp] ${new Date().toISOString()} ${message}`);
}

// ===== Sessões (uma por conta WhatsApp) =====
function createSessionState(sessionId) {
  return {
    sessionId,
    client: null,
    connectionState: 'disconnected',
    qrCode: null,
    lastError: null,
    starting: false,
    recentMessages: [],
    connectedAt: null,
    lastSyncAt: null,
    deviceName: null,
    devicePhone: null,
  };
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
const DEFAULT_MONITOR_CONFIG = {
  enabled: false,
  parentGroupId: null,
  childGroupIds: [],
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

// Normaliza o id da mensagem da API real ({ id, _serialized } ou string).
function rawMessageId(message) {
  if (!message || !message.id) return null;
  const id = message.id;
  if (typeof id === 'string') return id;
  return id._serialized || id.id || null;
}

// Deduplicação em memória (por mensagem) — permitida nesta fase.
const processedMessageIds = new Set();

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

// Autor real da mensagem no grupo. Para mensagens de outros membros o WPP
// expõe `author`; para fromMe usamos o contato serializado (a própria conta).
function rawMessageAuthorId(message) {
  if (!message) return null;
  if (message.author) return message.author;
  const sender = message.sender || null;
  if (sender) {
    if (sender.id && typeof sender.id === 'object' && sender.id._serialized) {
      return sender.id._serialized;
    }
    if (typeof sender.id === 'string') return sender.id;
  }
  return message.from || null;
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

  const numbers = new Set();
  for (const participant of participants || []) {
    const raw =
      (participant && participant._serialized) ||
      (participant && participant.id && participant.id._serialized) ||
      (participant && participant.id) ||
      participant;
    const number = canonicalNumber(raw);
    if (number) numbers.add(number);
  }

  groupAdminsCache.set(key, {
    numbers,
    expiresAt: Date.now() + ADMIN_CACHE_TTL_MS,
  });
  monitorLog(sessionId, `admins do grupo mãe ${groupId} carregados (${numbers.size})`);
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
    monitorLog(sessionId, 'mensagem recebida');

    const parentId = cfg.parentGroupId;
    const chatId = message.chatId || message.from || null;
    if (!chatId) return;

    if (!/^[^\s@]+@g\.us$/i.test(chatId)) {
      monitorLog(sessionId, `origem ignorada: não é grupo (${chatId})`);
      return;
    }
    if (/@broadcast|@newsletter/i.test(chatId)) {
      monitorLog(sessionId, `origem ignorada: broadcast/newsletter (${chatId})`);
      return;
    }
    if (chatId !== parentId) {
      monitorLog(sessionId, `origem ignorada: ${chatId} != grupo mãe ${parentId}`);
      return;
    }

    const msgId = rawMessageId(message);
    if (!msgId) {
      monitorLog(sessionId, 'origem validada mas sem messageId identificável');
      return;
    }
    if (processedMessageIds.has(msgId)) {
      monitorLog(sessionId, `mensagem já processada (messageId=${msgId}) - ignorada`);
      return;
    }
    processedMessageIds.add(msgId);

    // Somente ADMINISTRADORES do Grupo Mãe distribuem. A própria conta (fromMe)
    // é aceita também, desde que seja admin do Grupo Mãe.
    const monClient = getSessionState(sessionId).client;
    if (!monClient || typeof monClient.getGroupAdmins !== 'function') {
      monitorLog(sessionId, 'cliente indisponível - autor não autorizado (falha segura)');
      return;
    }
    const authorId = rawMessageAuthorId(message);
    monitorLog(sessionId, `autor = ${authorId || '?'} (fromMe=${!!message.fromMe})`);
    const adminNumbers = await ensureGroupAdminNumbers(monClient, sessionId, parentId);
    if (!adminNumbers) {
      monitorLog(sessionId, 'não foi possível confirmar admins - autor não autorizado');
      return;
    }
    const authorNumber = canonicalNumber(authorId);
    if (!authorNumber || !adminNumbers.has(authorNumber)) {
      monitorLog(sessionId, 'autor não autorizado');
      monitorLog(sessionId, `messageId = ${msgId}`);
      return;
    }
    monitorLog(sessionId, 'autor validado (admin do grupo mãe)');

    const body = typeof message.body === 'string' ? message.body : null;
    if (!body || !body.trim()) {
      monitorLog(
        sessionId,
        `mensagem não-texto ignorada (messageId=${msgId}, type=${message.type || 'desconhecido'})`
      );
      return;
    }
    const text = body.trim();

    monitorLog(sessionId, `origem validada (grupo mãe ${parentId})`);
    monitorLog(sessionId, `messageId = ${msgId}`);

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

    // Escopo da etapa: exatamente 1 destino real da mesma conta.
    const target = children[0];
    monitorLog(sessionId, `enviando para grupo filho ${target}`);

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
      sent = await st.client.sendText(target, text);
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
    monitorLog(
      sessionId,
      `enviado com sucesso (groupId=${target}, messageId=${sentId || 'n/a'})`
    );
  } catch (err) {
    monitorErrorLog(
      sessionId,
      `falha no processamento: ${String((err && err.message) || err)}`
    );
  }
}

// ===== Mapeamento de estados do WPPConnect =====
function handleStatusFind(state, statusSession) {
  const s = String(statusSession || '');
  switch (s) {
    case 'inChat':
    case 'isLogged':
      state.qrCode = null;
      if (state.connectionState !== 'connected') setSessionState(state, 'connecting');
      logWhatsApp(`[${state.sessionId}] sessão autenticada no WhatsApp Web`);
      break;
    case 'qrReadSuccess':
      state.qrCode = null;
      setSessionState(state, 'connecting');
      logWhatsApp(`[${state.sessionId}] QR autenticado - aguardando cliente pronto`);
      break;
    case 'notLogged':
      setSessionState(state, 'awaiting_qr');
      break;
    case 'qrReadError':
    case 'qrReadFail':
      setSessionState(state, 'awaiting_qr');
      logWhatsApp(`[${state.sessionId}] leitura de QR falhou - novo QR gerado`);
      break;
    case 'phoneNotConnected':
      if (state.connectionState !== 'connected') setSessionState(state, 'connecting');
      break;
    case 'autocloseCalled':
    case 'browserClose':
    case 'serverClose':
    case 'disconnectedMobile':
      setSessionState(state, 'disconnected');
      state.qrCode = null;
      logWhatsApp(`[${state.sessionId}] sessão encerrada/fechada (${s})`);
      break;
    default:
      logWhatsApp(`[${state.sessionId}] statusFind não mapeado: ${statusSession}`);
  }
}

// Estados intermediários válidos NUNCA viram ERROR.
function handleSocketState(state, socketState) {
  const s = String(socketState || '').toUpperCase();
  switch (s) {
    case 'CONNECTED':
      state.qrCode = null;
      setSessionState(state, 'connected');
      void refreshHostDevice(state);
      break;
    case 'OPENING':
    case 'PAIRING':
      if (state.connectionState !== 'connected') setSessionState(state, 'connecting');
      break;
    case 'UNPAIRED':
    case 'UNPAIRED_IDLE':
      setSessionState(state, 'awaiting_qr');
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

async function createSession(sessionId) {
  const state = getSessionState(sessionId);
  if (state.client || state.starting) return state;
  state.starting = true;
  state.qrCode = null;
  state.lastError = null;
  setSessionState(state, 'connecting');

  logWhatsApp(`[${sessionId}] connect solicitado - iniciando sessão WPPConnect`);

  try {
    const created = await create({
      session: sessionId,
      folderNameToken: SESSION_DIR,
      catchQR: (base64Qr) => {
        state.qrCode = String(base64Qr || '');
        setSessionState(state, 'awaiting_qr');
        logWhatsApp(`[${sessionId}] QR gerado - pronto para escaneamento`);
      },
      statusFind: (statusSession) => handleStatusFind(state, statusSession),
      headless: true,
      logQR: false,
      puppeteerOptions: {
        executablePath: CHROME_PATH,
        headless: true,
      },
      // Mantem a sessao viva em segundo plano mesmo sem QR escaneado.
      autoClose: 0,
    });

    state.client = created;
    state.starting = false;
    logWhatsApp(`[${sessionId}] cliente inicializado`);

    // A v2.3.3 resolve o create() já com a sessão conectada quando há tokens
    // válidos. Confirma com getConnectionState e só então marca CONNECTED.
    let socketState = null;
    if (typeof state.client.getConnectionState === 'function') {
      try {
        socketState = await state.client.getConnectionState();
      } catch (err) {
        logError(
          `[WhatsApp ${sessionId}] getConnectionState falhou: ${String((err && err.message) || err)}`
        );
      }
    }
    if (socketState) {
      handleSocketState(state, socketState);
    } else {
      state.qrCode = null;
      setSessionState(state, 'connected');
      void refreshHostDevice(state);
    }

    registerSessionListeners(state);
  } catch (err) {
    state.starting = false;
    const msg = String((err && err.message) || err);
    state.lastError = msg;
    setSessionState(state, 'error');
    state.client = null;
    logError(`[WhatsApp ${sessionId}] falha ao iniciar sessão: ${msg}`);
  }
  return state;
}

// Listeners reais da API v2.3.3 (sem client.on).
// Cada registro é isolado: falha em listener NUNCA derruba a sessão.
function registerSessionListeners(state) {
  const sessionClient = state.client;
  if (sessionClient && typeof sessionClient.onMessage === 'function') {
    try {
      sessionClient.onMessage((message) => {
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
        handleSocketState(state, socketState);
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
  state.qrCode = null;
  state.starting = false;
  setSessionState(state, 'disconnected');
  state.lastError = null;
  logWhatsApp(`[${sessionId}] sessão destruída`);
}

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      const allowed = new Set([
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]);
      if (!origin || allowed.has(origin)) {
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

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'domnex-whatsapp-server', session: DOMNEX_DEFAULT_SESSION });
});

// ===== Contas (multisessão) =====
app.get('/api/whatsapp/accounts', (req, res) => {
  res.json({ ok: true, accounts: buildAccountView(), maxAccounts: MAX_ACCOUNTS });
});

app.post('/api/whatsapp/accounts', (req, res) => {
  if (accounts.length >= MAX_ACCOUNTS) {
    return res
      .status(409)
      .json({ ok: false, error: `Limite de ${MAX_ACCOUNTS} contas atingido.` });
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
    void createSession(sessionId);
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
  void createSession(sessionId);
  res.json({ ok: true, session: sessionId, status: 'connecting' });
});

app.get('/api/whatsapp/qr', (req, res) => {
  const qr = getSessionState(DOMNEX_DEFAULT_SESSION).qrCode;
  if (!qr) {
    return res.status(204).json({ qr: null });
  }
  res.json({ qr });
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
  });
});

app.post('/api/monitor', (req, res) => {
  const { enabled, parentGroupId, childGroupIds, sessionId } = req.body || {};
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

  saveMonitorConfig();
  logInfo(
    `monitor atualizado (${sid}): enabled=${cfg.enabled} mãe=${
      cfg.parentGroupId || '—'
    } filho(s)=${cfg.childGroupIds.length}`
  );
  res.json({
    ok: true,
    session: sid,
    enabled: Boolean(cfg.enabled),
    parentGroupId: cfg.parentGroupId,
    childGroupIds: cfg.childGroupIds,
  });
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
        void createSession(acc.sessionId);
      }, delay);
      delay += 8000;
    }
  } else {
    logWhatsApp('sem sessões persistidas - aguardando /connect');
  }
});