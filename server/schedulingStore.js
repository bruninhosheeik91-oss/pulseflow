'use strict';

// ===== Agendamentos — persistência server-side (PULSE FLOW / Railway) =====
//
// Arquivo: <STATE_DIR>/data/schedules.json (STATE_DIR = PULSEFLOW_STATE_DIR).
//
// Apenas REGISTRA a intenção de disparo e aplica a máquina de estados. Quem
// DISPARA de fato é o executor server-side (server/schedulingExecutor.js):
// ele faz o claim (scheduled -> running) AQUI, de forma atômica/serializada,
// e conclui com running -> executed/failed. Nada aqui envia mensagem nem roda
// timer/scheduler.
// - executionStartedAt: momento exato do claim (scheduled -> running).
// - sentMessageId: id retornado pelo WPPConnect no envio executado com sucesso.
// - deliveryUncertain: true quando a entrega é DÚBIA (timeout de envio ou
//   running órfão após queda do processo) — a mensagem pode ter sido enviada;
//   o reenvio deve ser manual e com verificação prévia.
//
// Segurança/consistência:
//   - escrita ATOMICA (arquivo temporário + rename) para nunca deixar JSON
//     corrompido em disco;
//   - escritas concorrentes SERIALIZADAS via corrente de promises, sempre
//     gravando o snapshot COMPLETO do estado em memória — duas criações
//     simultaneas nunca perdem registro;
//   - ids (randomUUID) e timestamps gerados SOMENTE aqui (backend);

const { randomUUID } = require('node:crypto');
const {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const path = require('node:path');

const STATUS_ORDER = ['scheduled', 'running', 'executed', 'failed', 'cancelled'];

// Máquina de estados. Toda transição precisa estar explícita aqui; transição
// para o MESMO status ou para fora da lista NÃO é aceita.
const ALLOWED_TRANSITIONS = {
  scheduled: ['running', 'cancelled'],
  running: ['executed', 'failed'],
  failed: ['scheduled'],
  executed: [],
  cancelled: [],
};

// DELETE só é permitido sobre status "fechados": executado, falhou ou
// cancelado. scheduled/running são protegidos.
const DELETABLE_STATUSES = ['executed', 'failed', 'cancelled'];

class ScheduleStoreError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ScheduleStoreError';
    this.statusCode = statusCode;
  }
}

function str(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidDateTime(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  return Number.isFinite(Date.parse(value));
}

// ===== helpers de escrita atômica =====
function atomicWriteJson(filePath, payload) {
  const tmp = `${filePath}.${process.pid}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 8)}.tmp`;
  writeFileSync(tmp, payload, 'utf8');
  try {
    renameSync(tmp, filePath);
  } catch (err) {
    try {
      rmSync(tmp, { force: true });
    } catch {
      // melhor esforço de limpeza
    }
    throw err;
  }
}

function readFileSafe(filePath) {
  try {
    if (!existsSync(filePath)) return [];
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    if (parsed && Array.isArray(parsed.schedules)) {
      return parsed.schedules.filter(
        (item) => item && typeof item === 'object' && typeof item.id === 'string'
      );
    }
    return [];
  } catch {
    return [];
  }
}

// ===== Validação de payloads =====
function validateNewFields(input) {
  const raw = input && typeof input === 'object' ? input : {};

  const title = str(raw.title);
  if (!title) {
    throw new ScheduleStoreError(400, 'Título é obrigatório.');
  }
  if (title.length > 160) {
    throw new ScheduleStoreError(400, 'Título deve ter no máximo 160 caracteres.');
  }

  const sessionId = str(raw.sessionId);
  if (!sessionId) {
    throw new ScheduleStoreError(400, 'sessionId é obrigatório.');
  }

  const destinationId = str(raw.destinationId);
  if (!destinationId) {
    throw new ScheduleStoreError(400, 'destinationId é obrigatório.');
  }

  const message = str(raw.message);
  if (!message) {
    throw new ScheduleStoreError(400, 'Mensagem é obrigatória.');
  }
  if (message.length > 4000) {
    throw new ScheduleStoreError(400, 'Mensagem deve ter no máximo 4000 caracteres.');
  }

  if (!isValidDateTime(raw.scheduledAt)) {
    throw new ScheduleStoreError(400, 'scheduledAt é inválido.');
  }

  return {
    title: title.slice(0, 160),
    sessionId,
    accountName: str(raw.accountName).slice(0, 120),
    destinationId,
    destinationName: str(raw.destinationName).slice(0, 160),
    message: message.slice(0, 4000),
    scheduledAt: new Date(raw.scheduledAt).toISOString(),
  };
}

// Valida apenas os campos EDITÁVEIS vindos de um PATCH (campos opcionais).
function validatePatchFields(patch, current) {
  const next = { ...current };
  const raw = patch && typeof patch === 'object' ? patch : {};

  if ('title' in raw) {
    const title = str(raw.title);
    if (!title) throw new ScheduleStoreError(400, 'Título é obrigatório.');
    next.title = title.slice(0, 160);
  }
  if ('sessionId' in raw) {
    const sessionId = str(raw.sessionId);
    if (!sessionId) throw new ScheduleStoreError(400, 'sessionId é obrigatório.');
    next.sessionId = sessionId;
  }
  if ('destinationId' in raw) {
    const destinationId = str(raw.destinationId);
    if (!destinationId) {
      throw new ScheduleStoreError(400, 'destinationId é obrigatório.');
    }
    next.destinationId = destinationId;
  }
  if ('message' in raw) {
    const message = str(raw.message);
    if (!message) throw new ScheduleStoreError(400, 'Mensagem é obrigatória.');
    next.message = message.slice(0, 4000);
  }
  if ('accountName' in raw) {
    next.accountName = str(raw.accountName).slice(0, 120);
  }
  if ('destinationName' in raw) {
    next.destinationName = str(raw.destinationName).slice(0, 160);
  }
  if ('scheduledAt' in raw) {
    if (!isValidDateTime(raw.scheduledAt)) {
      throw new ScheduleStoreError(400, 'scheduledAt é inválido.');
    }
    next.scheduledAt = new Date(raw.scheduledAt).toISOString();
  }
  if ('errorMessage' in raw) {
    next.errorMessage =
      raw.errorMessage === null || raw.errorMessage === undefined
        ? null
        : str(raw.errorMessage).slice(0, 500) || null;
  }
  return next;
}

function assertFutureScheduledAt(scheduledAt, now) {
  const ms = new Date(scheduledAt).getTime();
  if (!Number.isFinite(ms)) {
    throw new ScheduleStoreError(400, 'scheduledAt é inválido.');
  }
  if (ms <= now) {
    throw new ScheduleStoreError(400, 'scheduledAt precisa estar no futuro.');
  }
}

function assertStatus(value) {
  if (!STATUS_ORDER.includes(value)) {
    throw new ScheduleStoreError(
      400,
      `Status inválido. Permitidos: ${STATUS_ORDER.join(', ')}.`
    );
  }
}

function assertAllowedTransition(fromStatus, toStatus) {
  assertStatus(fromStatus);
  assertStatus(toStatus);
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new ScheduleStoreError(
      409,
      `Transição de status inválida: ${fromStatus} -> ${toStatus}.`
    );
  }
}

// Aplica o novo status no registro, preenchendo timestamps correspondentes.
// deliveryUncertain=false para estados "certos":
//   - criação e reagendamento ('scheduled'): limpa a marca da tentativa anterior;
//   - sucesso comprovado ('executed');
//   - falha normal ('failed') com flag explícita false.
// True apenas quando a entrega é dúbia (timeout de envio, running órfão no boot).
function applyStatus(record, toStatus, patch) {
  const now = new Date().toISOString();
  if (toStatus === 'executed' || toStatus === 'failed') {
    record.executedAt = now;
  }
  if (toStatus === 'executed') {
    record.deliveryUncertain = false;
  }
  if (toStatus === 'cancelled') {
    record.cancelledAt = now;
  }
  if (toStatus === 'failed' && patch && 'errorMessage' in patch) {
    record.errorMessage =
      str(patch.errorMessage).slice(0, 500) || null;
  }
  if (
    toStatus === 'failed' &&
    patch &&
    typeof patch.deliveryUncertain === 'boolean'
  ) {
    record.deliveryUncertain = patch.deliveryUncertain;
  }
  if (toStatus === 'scheduled') {
    // Reagendamento/falha: limpa marcadores da tentativa anterior (inclusive a
    // marca de entrega incerta — o usuário decidiu reenviar manualmente).
    record.executedAt = null;
    record.cancelledAt = null;
    record.errorMessage = null;
    record.deliveryUncertain = false;
  }
  record.status = toStatus;
  record.updatedAt = now;
  return record;
}

// ===== Store =====
function createSchedulesStore(options = {}) {
  const dataDir = options.dataDir || path.join(__dirname, 'data');
  const filePath = path.join(dataDir, 'schedules.json');
  const now = options.now || (() => Date.now());

  let schedules = readFileSafe(filePath);
  // Serialização da escrita em disco: garante que duas mutações simultâneas
  // não corrompem o arquivo nem perdem registros (sempre grava o estado atual
  // completo da memória, na ordem em que as mutações aconteceram).
  let writeChain = Promise.resolve();

  function persist() {
    const payload = JSON.stringify({ schedules }, null, 2);
    writeChain = writeChain
      .then(() => {
        if (!existsSync(dataDir)) {
          mkdirSync(dataDir, { recursive: true });
        }
        atomicWriteJson(filePath, payload);
      })
      .catch((err) => {
        // A falha de escrita não pode travar a corrente: próximas mutações
        // continuam tentando gravar o estado mais recente.
        if (options.logError) {
          options.logError(
            `falha ao persistir agendamentos: ${String(err && err.message ? err.message : err)}`
          );
        }
      });
    return writeChain;
  }

  function list() {
    return schedules.slice().sort((a, b) => {
      const diff =
        Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt);
      return diff !== 0 ? diff : a.createdAt.localeCompare(b.createdAt);
    });
  }

  function get(id) {
    return schedules.find((item) => item.id === id) || null;
  }

  function create(input) {
    const fields = validateNewFields(input);
    const createdAt = new Date(now()).toISOString();
    // Data futura OBRIGATÓRIA na criação.
    assertFutureScheduledAt(fields.scheduledAt, now());
    const record = {
      id: randomUUID(),
      title: fields.title,
      sessionId: fields.sessionId,
      accountName: fields.accountName,
      destinationId: fields.destinationId,
      destinationName: fields.destinationName,
      scheduledAt: fields.scheduledAt,
      message: fields.message,
      status: 'scheduled',
      createdAt,
      updatedAt: createdAt,
      executedAt: null,
      cancelledAt: null,
      errorMessage: null,
      sentMessageId: null,
      executionStartedAt: null,
      deliveryUncertain: false,
    };
    schedules.push(record);
    persist();
    return { ...record };
  }

  function update(id, patch) {
    const index = schedules.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ScheduleStoreError(404, 'Agendamento não encontrado.');
    }
    const current = { ...schedules[index] };
    const raw = patch && typeof patch === 'object' ? patch : {};

    if ('status' in raw) {
      // Transição de status: segue apenas a máquina de estados válida.
      const toStatus = str(raw.status);
      assertAllowedTransition(current.status, toStatus);
      applyStatus(current, toStatus, raw);
      schedules[index] = current;
      persist();
      return { ...current };
    }

    // Edição de METADADOS só é permitida enquanto o agendamento ainda está
    // 'scheduled'. executed/cancelled são imutáveis; running não permite
    // edição (a operação já começou).
    if (current.status !== 'scheduled') {
      throw new ScheduleStoreError(
        409,
        `Agendamento ${current.status} não pode ser editado (apenas agendamentos 'scheduled').`
      );
    }
    const next = validatePatchFields(raw, current);
    if ('scheduledAt' in raw) {
      // Reagendar mantém o requisito de data futura (ainda contará como
      // agendamento pendente).
      assertFutureScheduledAt(next.scheduledAt, now());
    }
    next.updatedAt = new Date(now()).toISOString();
    schedules[index] = next;
    persist();
    return { ...next };
  }

  function remove(id) {
    const index = schedules.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ScheduleStoreError(404, 'Agendamento não encontrado.');
    }
    const current = schedules[index];
    if (!DELETABLE_STATUSES.includes(current.status)) {
      throw new ScheduleStoreError(
        409,
        `Agendamento ${current.status} não pode ser removido. Remova apenas agendamentos executed, failed ou cancelled.`
      );
    }
    schedules.splice(index, 1);
    persist();
    return true;
  }

  // Aguarda a fila de escrita em disco terminar (usado por testes e por
  // operações que precisam garantir durabilidade antes de responder).
  function flush() {
    return writeChain;
  }

  // ===== Operações do executor (Etapa 3) =====
  // Todos os métodos abaixo são SÍNCRONOS entre a leitura e a mutação do array
  // em memória (sem await no meio), então são atômicos no event loop do Node:
  // dois chamadores concorrentes nunca intercalam. A persistência em disco
  // segue serializada pela writeChain, gravando sempre o snapshot completo.

  // Agendamentos vencidos (status=scheduled e scheduledAt <= agora), ordenados
  // pelo scheduledAt mais antigo (primeiro a vencer, primeiro a executar).
  function listDue(nowMs) {
    const cutoff = Number.isFinite(nowMs) ? nowMs : now();
    return schedules
      .filter(
        (item) =>
          item.status === 'scheduled' &&
          Date.parse(item.scheduledAt) <= cutoff
      )
      .sort(
        (a, b) =>
          Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt) ||
          a.createdAt.localeCompare(b.createdAt)
      )
      .map((item) => ({ ...item }));
  }

  // Claim ATÔMICO scheduled -> running. Retorna null quando o registro não
  // está mais 'scheduled' (já executado/cancelado/em outra transição): o
  // chamador deve IGNORAR. Só uma chamada vence o claim por registro.
  function claim(id, customNowMs) {
    const index = schedules.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const current = schedules[index];
    if (current.status !== 'scheduled') return null;
    const stamp = new Date(Number.isFinite(customNowMs) ? customNowMs : now()).toISOString();
    current.status = 'running';
    current.executionStartedAt = stamp;
    current.updatedAt = stamp;
    persist();
    return { ...current };
  }

  // running -> executed. Opcionalmente persistir o id retornado pelo WPPConnect.
  function markExecuted(id, sentMessageId, customNowMs) {
    const index = schedules.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ScheduleStoreError(404, 'Agendamento não encontrado.');
    }
    const current = schedules[index];
    assertAllowedTransition(current.status, 'executed');
    applyStatus(current, 'executed', {});
    current.sentMessageId =
      typeof sentMessageId === 'string' && sentMessageId.trim()
        ? sentMessageId.trim().slice(0, 200)
        : null;
    if (Number.isFinite(customNowMs)) current.executedAt = new Date(customNowMs).toISOString();
    schedules[index] = current;
    persist();
    return { ...current };
  }

  // running -> failed, salvando errorMessage sanitizada pelo chamador.
  // deliveryUncertain=true sinaliza que NÃO se pode garantir a entrega (ex.:
  // timeout de envio: a mensagem PODE ter sido enviada; não reenviar sem
  // verificação manual).
  function markFailed(id, errorMessage, customNowMs, deliveryUncertain) {
    const index = schedules.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ScheduleStoreError(404, 'Agendamento não encontrado.');
    }
    const current = schedules[index];
    assertAllowedTransition(current.status, 'failed');
    applyStatus(current, 'failed', {
      errorMessage: errorMessage || 'Erro desconhecido.',
      ...(typeof deliveryUncertain === 'boolean'
        ? { deliveryUncertain }
        : {}),
    });
    if (Number.isFinite(customNowMs)) {
      current.executedAt = new Date(customNowMs).toISOString();
      current.updatedAt = new Date(customNowMs).toISOString();
    }
    schedules[index] = current;
    persist();
    return { ...current };
  }

  // Recuperação no BOOT: running órfãos (processo caiu com mensagem talvez já
  // enviada) viram failed com mensagem clara. NUNCA há reenvio automático.
  // deliveryUncertain=true: a queda pode ter ocorrido APÓS o envio — exigir
  // verificação manual antes de qualquer reenvio.
  // Retorna os ids recuperados. Persiste só se houver algo a fazer.
  function recoverOrphanedRunning(customNowMs) {
    const stamp = new Date(Number.isFinite(customNowMs) ? customNowMs : now()).toISOString();
    const recoveredIds = [];
    for (const item of schedules) {
      if (item.status === 'running') {
        item.status = 'failed';
        item.errorMessage =
          'Execução interrompida antes da confirmação. Reenvio manual necessário.';
        item.deliveryUncertain = true;
        item.executedAt = stamp;
        item.updatedAt = stamp;
        recoveredIds.push(item.id);
      }
    }
    if (recoveredIds.length > 0) persist();
    return recoveredIds;
  }

  return {
    list,
    get,
    create,
    update,
    remove,
    flush,
    listDue,
    claim,
    markExecuted,
    markFailed,
    recoverOrphanedRunning,
  };
}

module.exports = {
  createSchedulesStore,
  ScheduleStoreError,
  ALLOWED_TRANSITIONS,
  DELETABLE_STATUSES,
  STATUS_ORDER,
};