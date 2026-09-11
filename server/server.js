'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const { create } = require('@wppconnect-team/wppconnect');
const { existsSync, mkdirSync } = require('fs');

const PORT = Number(process.env.PORT || 3001);
const HOST = '127.0.0.1';
const SESSION_NAME = 'domnex-main';
const SESSION_DIR = path.join(__dirname, 'tokens');
const CHROME_PATH =
  process.env.WPP_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RECENT_LIMIT = 200;

let client = null;
let qrCode = null;
let connectionState = 'disconnected';
let lastError = null;
let starting = false;
const recentMessages = [];

function logInfo(message) {
  console.log(`[info] ${new Date().toISOString()} ${message}`);
}

function logError(message) {
  console.error(`[error] ${new Date().toISOString()} ${message}`);
}

function logWhatsApp(message) {
  console.log(`[WhatsApp] ${new Date().toISOString()} ${message}`);
}

function setState(next) {
  connectionState = next;
}

function registerMessage(message) {
  if (!message) return;
  try {
    const isGroup = !!message.isGroupMsg;
    const entry = {
      id:
        (message.id && (message.id._serialized || message.id.id)) || message.id ||
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
    recentMessages.push(entry);
    if (recentMessages.length > RECENT_LIMIT) {
      recentMessages.splice(0, recentMessages.length - RECENT_LIMIT);
    }
    logInfo(
      `evento de mensagem [${entry.type}] de ${entry.from} em ${entry.chatId}${
        isGroup ? ' (grupo)' : ''
      }`
    );
  } catch (err) {
    logError('falha ao registrar evento de mensagem');
  }
}

// Mapeia estados iniciais do WPPConnect (callback statusFind da v2.3.3).
function handleStatusFind(statusSession) {
  const s = String(statusSession || '');
  switch (s) {
    case 'inChat':
    case 'isLogged':
      qrCode = null;
      if (connectionState !== 'connected') setState('connecting');
      logWhatsApp('sessão autenticada no WhatsApp Web');
      break;
    case 'qrReadSuccess':
      qrCode = null;
      setState('connecting');
      logWhatsApp('QR autenticado - aguardando cliente pronto');
      break;
    case 'notLogged':
      setState('awaiting_qr');
      break;
    case 'qrReadError':
    case 'qrReadFail':
      setState('awaiting_qr');
      logWhatsApp('leitura de QR falhou - novo QR gerado');
      break;
    case 'phoneNotConnected':
      if (connectionState !== 'connected') setState('connecting');
      break;
    case 'autocloseCalled':
    case 'browserClose':
    case 'serverClose':
    case 'disconnectedMobile':
      setState('disconnected');
      qrCode = null;
      logWhatsApp(`sessão encerrada/fechada (${s})`);
      break;
    default:
      logWhatsApp(`statusFind não mapeado: ${statusSession}`);
  }
}

// Mapeia SocketState do WPPConnect para os estados do DOMNEX.
// Estados intermediários válidos NUNCA viram ERROR.
function handleSocketState(state) {
  const s = String(state || '').toUpperCase();
  switch (s) {
    case 'CONNECTED':
      qrCode = null;
      setState('connected');
      break;
    case 'OPENING':
    case 'PAIRING':
      if (connectionState !== 'connected') setState('connecting');
      break;
    case 'UNPAIRED':
    case 'UNPAIRED_IDLE':
      setState('awaiting_qr');
      break;
    case 'CONFLICT':
      lastError = 'CONFLICT - sessão aberta em outro dispositivo';
      setState('error');
      logError(`[WhatsApp] conflito de sessão: ${lastError}`);
      break;
    case 'TIMEOUT':
      setState('reconnecting');
      logWhatsApp('timeout na conexão - reconectando');
      break;
    case 'PROXYBLOCK':
    case 'SMB_TOS_BLOCK':
    case 'TOS_BLOCK':
    case 'DEPRECATED_VERSION':
    case 'UNLAUNCHED':
      lastError = `${s} - WhatsApp Web bloqueado/indisponível`;
      setState('error');
      logError(`[WhatsApp] estado de bloqueio: ${s}`);
      break;
    default:
      logWhatsApp(`status não mapeado: ${state}`);
  }
  logWhatsApp(`estado = ${connectionState}`);
}

async function createSession() {
  if (client || starting) return;
  starting = true;
  setState('connecting');
  qrCode = null;
  lastError = null;

  logWhatsApp('connect solicitado - iniciando sessão WPPConnect');

  try {
    const created = await create({
      session: SESSION_NAME,
      folderNameToken: SESSION_DIR,
      catchQR: (base64Qr) => {
        qrCode = String(base64Qr || '');
        setState('awaiting_qr');
        logWhatsApp('QR gerado - pronto para escaneamento');
      },
      statusFind: handleStatusFind,
      headless: true,
      logQR: false,
      puppeteerOptions: {
        executablePath: CHROME_PATH,
        headless: true,
      },
      // Mantem a sessao viva em segundo plano mesmo sem QR escaneado.
      autoClose: 0,
    });

    client = created;
    starting = false;
    logWhatsApp('cliente inicializado');

    // A v2.3.3 resolve o create() já com a sessão conectada quando há tokens
    // válidos. Confirma com getConnectionState e só então marca CONNECTED.
    let socketState = null;
    if (typeof client.getConnectionState === 'function') {
      try {
        socketState = await client.getConnectionState();
      } catch (err) {
        logError(`[WhatsApp] getConnectionState falhou: ${String((err && err.message) || err)}`);
      }
    }
    if (socketState) {
      handleSocketState(socketState);
    } else {
      qrCode = null;
      setState('connected');
    }

    registerSessionListeners(client);
  } catch (err) {
    starting = false;
    const msg = String((err && err.message) || err);
    lastError = msg;
    setState('error');
    client = null;
    logError(`[WhatsApp] falha ao iniciar sessão: ${msg}`);
  }
}

// Listeners reais da API v2.3.3 (sem client.on).
// Cada registro é isolado: falha em listener NUNCA derruba a sessão.
function registerSessionListeners(sessionClient) {
  if (sessionClient && typeof sessionClient.onMessage === 'function') {
    try {
      sessionClient.onMessage((message) => {
        registerMessage(message);
      });
      logWhatsApp('listener onMessage registrado');
    } catch (err) {
      logError(
        `[WhatsApp] falha ao registrar onMessage: ${String((err && err.message) || err)}`
      );
    }
  } else {
    logError('[WhatsApp] onMessage indisponível no cliente');
  }

  if (sessionClient && typeof sessionClient.onStateChange === 'function') {
    try {
      sessionClient.onStateChange((state) => {
        handleSocketState(state);
      });
      logWhatsApp('listener onStateChange registrado');
    } catch (err) {
      logError(
        `[WhatsApp] falha ao registrar onStateChange: ${String((err && err.message) || err)}`
      );
    }
  } else {
    logError('[WhatsApp] onStateChange indisponível no cliente');
  }
}

async function destroySession() {
  const current = client;
  client = null;
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
  qrCode = null;
  starting = false;
  setState('disconnected');
  lastError = null;
  logWhatsApp('sessão destruída');
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

function requireConnected(req, res, next) {
  if (!client) {
    return res.status(409).json({ ok: false, error: 'Nao existe uma sessao ativa.' });
  }
  if (connectionState !== 'connected') {
    return res.status(409).json({
      ok: false,
      error: 'Sessao nao esta conectada.',
      status: connectionState,
    });
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'domnex-whatsapp-server', session: SESSION_NAME });
});

app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    ok: true,
    session: SESSION_NAME,
    status: connectionState,
    connected: connectionState === 'connected',
    qrPending: connectionState === 'awaiting_qr',
    error: lastError,
  });
});

app.post('/api/whatsapp/connect', (req, res) => {
  logWhatsApp('connect solicitado');
  if (starting) {
    return res.json({ ok: true, session: SESSION_NAME, status: 'connecting' });
  }
  if (client && connectionState !== 'disconnected' && connectionState !== 'error') {
    logWhatsApp('sessão existente encontrada - reutilizando cliente');
    return res.json({ ok: true, session: SESSION_NAME, status: connectionState });
  }
  void createSession();
  res.json({ ok: true, session: SESSION_NAME, status: 'connecting' });
});

app.get('/api/whatsapp/qr', (req, res) => {
  if (!qrCode) {
    return res.status(204).json({ qr: null });
  }
  res.json({ qr: qrCode });
});

app.get('/api/whatsapp/account', requireConnected, async (req, res) => {
  try {
    let number = null;
    let name = null;
    if (client && typeof client.getHostDevice === 'function') {
      const info = await client.getHostDevice();
      const raw = info || {};
      const me = raw.me || {};
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
    }
    res.json({
      ok: true,
      account: {
        number,
        name,
        connectionStatus: connectionState,
        lastSyncAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logError('[WhatsApp] falha ao obter dados da conta');
    res.status(500).json({ ok: false, error: 'Falha ao obter dados da conta.' });
  }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    await destroySession();
    res.json({ ok: true, status: 'disconnected' });
  } catch (err) {
    logError('[WhatsApp] falha ao desconectar');
    lastError = String((err && err.message) || err);
    setState('error');
    res.status(500).json({ ok: false, error: 'Falha ao desconectar.' });
  }
});

app.get('/api/whatsapp/groups', requireConnected, async (req, res) => {
  try {
    const chats = await client.getAllChats();
    const groups = (chats || [])
      .filter((chat) => chat.isGroup)
      .map((chat) => {
        const participants =
          chat.groupMetadata && Array.isArray(chat.groupMetadata.participants)
            ? chat.groupMetadata.participants.length
            : undefined;
        return {
          id: (chat.id && (chat.id._serialized || chat.id)) || '',
          name:
            chat.name ||
            chat.formattedTitle ||
            'Grupo sem nome',
          participants,
          type: 'Grupo',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    logWhatsApp(`grupos carregados = ${groups.length}`);
    res.json({ ok: true, groups, total: groups.length });
  } catch (err) {
    logError('[WhatsApp] falha ao listar grupos');
    res.status(500).json({ ok: false, error: 'Falha ao listar grupos.' });
  }
});

app.post('/api/whatsapp/send', requireConnected, async (req, res) => {
  const { groupId, message } = req.body || {};

  if (typeof groupId !== 'string' || !groupId.trim()) {
    return res.status(400).json({ ok: false, error: 'groupId e obrigatorio.' });
  }
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ ok: false, error: 'message e obrigatorio.' });
  }
  if (message.trim().length > 4096) {
    return res.status(400).json({
      ok: false,
      error: 'Mensagem muito longa (max. 4096 caracteres).',
    });
  }

  try {
    const sent = await client.sendText(groupId.trim(), message.trim());
    const messageId =
      (sent && sent.id && (sent.id._serialized || sent.id.id)) || null;
    logInfo(`mensagem enviada para ${groupId.trim()} (id ${messageId})`);
    res.json({ ok: true, messageId, timestamp: new Date().toISOString() });
  } catch (err) {
    logError('[WhatsApp] falha no envio de mensagem');
    res.status(500).json({ ok: false, error: 'Falha no envio.' });
  }
});

app.get('/api/whatsapp/messages/recent', (req, res) => {
  res.json({ ok: true, messages: recentMessages.slice(-50).reverse() });
});

app.use((err, req, res, next) => {
  logError(`erro nao tratado: ${String((err && err.message) || err)}`);
  res.status(500).json({ ok: false, error: 'Erro interno.' });
});

if (!existsSync(SESSION_DIR)) {
  mkdirSync(SESSION_DIR, { recursive: true });
}

app.listen(PORT, HOST, () => {
  logInfo(`API escutando em http://${HOST}:${PORT}`);
  const sessionExists = existsSync(path.join(SESSION_DIR, SESSION_NAME));
  if (sessionExists) {
    logWhatsApp('sessão persistida detectada - restaurando em segundo plano');
    void createSession();
  } else {
    logWhatsApp('sem sessão persistida - aguardando /connect');
  }
});