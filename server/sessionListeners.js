'use strict';

const LISTENER_REFRESH_MS = 90 * 1000;
const LISTENER_FORCE_SKIP_MS = 15 * 1000;

function registerSessionListeners(state, generation, reason, deps = {}) {
  const sessionId = state.sessionId;
  const client = state.client;

  if (!client) {
    deps.logError && deps.logError(`[WhatsApp ${sessionId}] re-registro de listeners sem cliente (motivo: ${reason})`);
    return null;
  }

  clearSessionListenerRegistry(state, 're-registro', deps);

  state.listenGen = (state.listenGen || 0) + 1;
  const listenGen = state.listenGen;

  const registry = {
    client,
    generation,
    listenGen,
    at: Date.now(),
    reason,
    entries: {},
  };

  const isCurrent = () =>
    state.client === client &&
    state.initGen === generation &&
    state.listenGen === listenGen;

  if (typeof client.onMessage === 'function') {
    try {
      const disposable = client.onMessage((message) => {
        if (!isCurrent()) return;
        deps.registerMessage && deps.registerMessage(state, message);
      });
      registry.entries.onMessage = { kind: 'onMessage', disposable };
      deps.logWhatsApp && deps.logWhatsApp(
        `[${sessionId}] listener onMessage registrado (init #${generation}, registro #${listenGen}, motivo: ${reason})`
      );
    } catch (err) {
      deps.logError && deps.logError(
        `[WhatsApp ${sessionId}] falha ao registrar onMessage (init #${generation}, registro #${listenGen}, motivo: ${reason}): ${String((err && err.message) || err)}`
      );
    }
  } else {
    deps.logError && deps.logError(`[WhatsApp ${sessionId}] onMessage indisponível no cliente (init #${generation})`);
  }

  const monitorMode =
    typeof client.onAnyMessage === 'function'
      ? 'onAnyMessage'
      : typeof client.onMessage === 'function'
        ? 'onMessage'
        : null;

  if (monitorMode) {
    try {
      const disposer = client[monitorMode]((message) => {
        if (!isCurrent()) return;
        deps.handleMonitorReplication && deps.handleMonitorReplication(sessionId, message);
      });
      registry.entries.onAnyMessage = { kind: monitorMode, disposable: disposer };
      deps.monitorLog && deps.monitorLog(
        sessionId,
        `listener monitor (Grupo Mãe → Filho) registrado via ${monitorMode} (init #${generation}, registro #${listenGen}, motivo: ${reason})`
      );
    } catch (err) {
      deps.monitorErrorLog && deps.monitorErrorLog(
        sessionId,
        `falha ao registrar listener do monitor (init #${generation}, registro #${listenGen}, motivo: ${reason}): ${String((err && err.message) || err)}`
      );
    }
  } else {
    deps.monitorErrorLog && deps.monitorErrorLog(sessionId, 'listener do monitor indisponível no cliente');
  }

  if (typeof client.onStateChange === 'function') {
    try {
      const disposable = client.onStateChange((socketState) => {
        if (!isCurrent()) return;
        deps.handleSocketState && deps.handleSocketState(state, generation, socketState);
      });
      registry.entries.onStateChange = { kind: 'onStateChange', disposable };
      deps.logWhatsApp && deps.logWhatsApp(
        `[${sessionId}] listener onStateChange registrado (init #${generation}, registro #${listenGen}, motivo: ${reason})`
      );
    } catch (err) {
      deps.logError && deps.logError(
        `[WhatsApp ${sessionId}] falha ao registrar onStateChange (init #${generation}, registro #${listenGen}, motivo: ${reason}): ${String((err && err.message) || err)}`
      );
    }
  } else {
    deps.logError && deps.logError(`[WhatsApp ${sessionId}] onStateChange indisponível no cliente (init #${generation})`);
  }

  state.listenerRegistry = registry;
  return registry;
}

function clearSessionListenerRegistry(state, reason, deps = {}) {
  const registry = state.listenerRegistry;
  if (!registry) return null;

  for (const entry of Object.values(registry.entries)) {
    if (entry && entry.disposable && typeof entry.disposable.dispose === 'function') {
      try {
        entry.disposable.dispose();
      } catch (err) {
        deps.logError && deps.logError(
          `[WhatsApp ${state.sessionId}] falha ao descartar ${entry.kind} (registro #${registry.listenGen}): ${String((err && err.message) || err)}`
        );
      }
    }
  }

  state.listenerRegistry = null;
  deps.logWhatsApp && deps.logWhatsApp(
    `[${state.sessionId}] listeners antigos descartados (registro #${registry.listenGen}, motivo: ${reason})`
  );
  return registry;
}

function ensureSessionListeners(state, reason, opts = {}, deps = {}) {
  const sessionId = state.sessionId;
  const client = state.client;

  if (!client) {
    deps.logWhatsApp && deps.logWhatsApp(`[${sessionId}] re-registro de listeners ignorado - sem cliente (motivo: ${reason})`);
    return null;
  }

  const registry = state.listenerRegistry;
  const generation = state.initGen;
  const isCurrent =
    !!registry &&
    registry.client === client &&
    registry.generation === generation &&
    registry.listenGen === state.listenGen;

  const age = registry ? Date.now() - registry.at : Infinity;
  const wantsRefresh = registry
    ? (opts.force ? age >= LISTENER_FORCE_SKIP_MS : age >= LISTENER_REFRESH_MS)
    : true;

  if (isCurrent && !wantsRefresh) {
    return registry;
  }

  if (isCurrent) {
    deps.logWhatsApp && deps.logWhatsApp(
      `[${sessionId}] re-registro de listeners (init #${generation}, registro #${registry.listenGen}, motivo: ${reason})`
    );
  }

  return registerSessionListeners(state, generation, reason, deps);
}

module.exports = {
  registerSessionListeners,
  clearSessionListenerRegistry,
  ensureSessionListeners,
  LISTENER_REFRESH_MS,
  LISTENER_FORCE_SKIP_MS,
};