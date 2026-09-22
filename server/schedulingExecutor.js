'use strict';

// ===== Agendamentos — Executor server-side 24/7 (PULSE FLOW / Railway) =====
//
// Roda DENTRO do processo do backend (server.js), com um tick leve a cada
// tickIntervalMs (5s por padrão). A cada ciclo:
//   1. listDue(): agendamentos vencidos (status=scheduled e scheduledAt <= agora),
//      ordenados do mais antigo para o mais recente;
//   2. claim() atômico no schedulingStore: scheduled -> running. Se o registro
//      já não estiver scheduled, é ignorado (não envia duas vezes);
//   3. envia a mensagem via o MESMO cliente WPPConnect da sessão (state.client)
//      usando o MÉTODO REAL do backend (sendViaClient -> client.sendText);
//   4. sucesso  -> running -> executed (+ sentMessageId do WPPConnect);
//      falha/offline/timeout -> running -> failed (+ errorMessage real).
//      Timeout marca deliveryUncertain=true: o sendText PODE ter entregue a
//      mensagem; o reenvio só deve ser manual, com verificação no grupo.
//
// Garantias anti-duplicação:
//   - single-flight GLOBAL: nunca há dois ciclos rodando ao mesmo tempo;
//   - claim atômico no store: só um executor marca running;
//   - máximo 1 envio de agendamento por sessão por vez (processamento
//     sequencial dentro do ciclo);
//   - no boot NÃO reenviamos nada: running órfãos viram failed e o usuário usa
//     "Reenviar" (failed -> scheduled) se quiser;
//   - o executor NUNCA chama destroy/reconnect/QR: o watchdog continua sendo o
//     dono do ciclo de vida das sessões.

function sanitizeExecutorError(err) {
  const raw =
    err && typeof err.message === 'string'
      ? err.message
      : String((err && err.toString && err.toString()) || '');
  if (!raw || !raw.trim()) return 'erro desconhecido.';
  return raw.trim().slice(0, 300);
}

function createScheduleExecutor(options = {}) {
  const {
    schedulesStore,
    // (sessionId) => estado da sessão { client, connectionState, ... }.
    getSessionState = () => null,
    // (sessionClient, destinationId, message) => Promise<messageId|null>.
    // É o MÉTODO REAL de envio do backend (sendViaClient -> client.sendText),
    // injetado pelo server.js para evitar um segundo caminho de envio.
    sendText = async () => null,
    // Isolamento de clock para testes.
    now = () => Date.now(),
    tickIntervalMs = 5000,
    sendTimeoutMs = 20000,
    logInfo = () => {},
    logError = () => {},
    // Valida que o cliente existe e está REALMENTE conectado antes de enviar.
    isSessionConnected = (state) =>
      Boolean(
        state &&
          state.client &&
          typeof state.client.sendText === 'function' &&
          state.connectionState === 'connected'
      ),
  } = options;

  let started = false;
  let running = false;
  let timer = null;

  const isDueOn = (item, cutoffMs) =>
    item &&
    item.status === 'scheduled' &&
    Number.isFinite(Date.parse(item.scheduledAt)) &&
    Date.parse(item.scheduledAt) <= cutoffMs;

  // Envio com timeout controlado. Nunca deixamos um send travado segurar o
  // executor para sempre: após sendTimeoutMs o envio é abandonado e o
  // agendamento vira failed. Distingue timeout de sucesso sem id da mensagem.
  function runSend(client, destinationId, message) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve({ timedOut: true });
      }, sendTimeoutMs);
      Promise.resolve(sendText(client, destinationId, message)).then(
        (messageId) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({ messageId: messageId || null });
        },
        (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }

  // Processa UM agendamento vencido do início ao fim (claim -> envio -> fim).
  async function processDue(schedule) {
    const claimed = schedulesStore.claim(schedule.id, now());
    if (!claimed) {
      // Não está mais 'scheduled': já executado/cancelado por outra via.
      logInfo(`[Executor] agendamento ${schedule.id} ignorado (não está mais scheduled)`);
      return;
    }

    const sessionState = getSessionState(claimed.sessionId);
    if (!isSessionConnected(sessionState)) {
      logError(
        `[Executor] agendamento ${claimed.id}: conta indisponível/offline no horário agendado`
      );
      // Falha normal/segura: a mensagem CERTAMENTE não foi enviada.
      schedulesStore.markFailed(
        claimed.id,
        'Conta WhatsApp indisponível no horário agendado.',
        now(),
        false
      );
      return;
    }

    // sinaliza ao watchdog que há envio em andamento (nunca matar o browser
    // no meio de um sendText).
    const client = sessionState.client;
    sessionState.sendOps = (sessionState.sendOps || 0) + 1;
    try {
      const outcome = await runSend(client, claimed.destinationId, claimed.message);
      if (outcome.timedOut) {
        // NOTA CRÍTICA: o sendText PODE ter entregue a mensagem mesmo sem a
        // Promise resolver a tempo. Nunca tratar como falha comum (reenvio
        // imediato pode duplicar): deliveryUncertain=true.
        logError(
          `[Executor] agendamento ${claimed.id}: tempo de envio esgotado (${sendTimeoutMs}ms) — entrega incerta`
        );
        schedulesStore.markFailed(
          claimed.id,
          'O envio não retornou confirmação dentro do tempo limite. A mensagem pode ter sido enviada. Verifique o grupo antes de reenviar.',
          now(),
          true
        );
        return;
      }
      schedulesStore.markExecuted(claimed.id, outcome.messageId, now());
      sessionState.probeFailures = 0;
      if (typeof sessionState.runtimeTimeoutFailures === 'number') {
        sessionState.runtimeTimeoutFailures = 0;
        sessionState.runtimeTimeoutFirstFailureAt = null;
      }
      logInfo(`[Executor] agendamento ${claimed.id} executado com sucesso`);
    } catch (err) {
      const reason = sanitizeExecutorError(err);
      // Falha EXPLÍCITA no envio: o WPPConnect rejeitou — entrega não ocorreu.
      logError(`[Executor] agendamento ${claimed.id}: falha no envio (${reason})`);
      schedulesStore.markFailed(claimed.id, reason, now(), false);
    } finally {
      sessionState.sendOps = Math.max(0, sessionState.sendOps - 1);
    }
  }

  // Um ciclo completo. Single-flight GLOBAL: se um ciclo já está em andamento,
  // este retorna imediatamente — nunca há dois ciclos simultâneos.
  async function runCycle() {
    if (running) {
      logInfo('[Executor] ciclo anterior ainda em andamento - ignorando tick');
      return;
    }
    running = true;
    try {
      const due = schedulesStore.listDue(now());
      if (due.length > 0) {
        logInfo(`[Executor] ${due.length} agendamento(s) vencido(s) para processar`);
      }
      for (const schedule of due) {
        if (!isDueOn(schedule, now())) continue;
        await processDue(schedule);
      }
    } finally {
      running = false;
    }
  }

  function start() {
    if (started) return;
    started = true;
    logInfo(
      `[Executor] ativo - verifica agendamentos vencidos a cada ${tickIntervalMs}ms`
    );
    timer = setInterval(() => {
      runCycle().catch((err) => {
        logError(
          `[Executor] erro no ciclo: ${String((err && err.message) || err)}`
        );
      });
    }, tickIntervalMs);
    // Primeiro ciclo imediato (fora do timer), depois que o boot já marcou os
    // running órfãos como failed.
    setTimeout(() => {
      runCycle().catch((err) => {
        logError(
          `[Executor] erro no ciclo inicial: ${String((err && err.message) || err)}`
        );
      });
    }, 0);
  }

  function stop() {
    started = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return { start, stop, runCycle, isRunning: () => running };
}

module.exports = { createScheduleExecutor, sanitizeExecutorError };