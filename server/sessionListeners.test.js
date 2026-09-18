'use strict';

const assert = require('assert');
const { EventEmitter } = require('events');
const {
  registerSessionListeners,
  clearSessionListenerRegistry,
  ensureSessionListeners,
  LISTENER_REFRESH_MS,
  LISTENER_FORCE_SKIP_MS,
} = require('./sessionListeners.js');

class FakeClient {
  constructor() {
    this.emitter = new EventEmitter();
    this.calls = [];
  }
  onMessage(cb) {
    this.emitter.on('onMessage', cb);
    this.calls.push({ kind: 'onMessage', cb });
    return { dispose: () => this.emitter.off('onMessage', cb) };
  }
  onAnyMessage(cb) {
    this.emitter.on('onAnyMessage', cb);
    this.calls.push({ kind: 'onAnyMessage', cb });
    return { dispose: () => this.emitter.off('onAnyMessage', cb) };
  }
  onStateChange(cb) {
    this.emitter.on('onStateChange', cb);
    this.calls.push({ kind: 'onStateChange', cb });
    return { dispose: () => this.emitter.off('onStateChange', cb) };
  }
  emit(kind, ...args) {
    this.emitter.emit(kind, ...args);
  }
  registeredCount(kind) {
    return this.emitter.listenerCount(kind);
  }
}

const recorder = [];
const deps = makeDeps();

function makeDeps() {
  return {
    logWhatsApp: (m) => recorder.push(['info', m]),
    logError: (m) => recorder.push(['error', m]),
    monitorLog: (sid, m) => recorder.push(['monitor', `${sid}|${m}`]),
    monitorErrorLog: (sid, m) => recorder.push(['monitorError', `${sid}|${m}`]),
    registerMessage: (state, msg) => recorder.push(['registerMessage', state.sessionId, msg.id]),
    handleMonitorReplication: (sessionId, msg) => {
      recorder.push(['replicate', sessionId, msg.id]);
      return Promise.resolve();
    },
    handleSocketState: (state, generation, socketState) =>
      recorder.push(['socketState', state.sessionId, generation, socketState]),
  };
}

function reset() {
  recorder.length = 0;
}

function makeState(sessionId, client) {
  return {
    sessionId,
    client,
    initGen: 1,
    listenGen: 0,
    listenerRegistry: null,
  };
}

function count(kind) {
  return recorder.filter((e) => e[0] === kind).length;
}

function countPayload(kind, sessionId) {
  return recorder.filter((e) => e[0] === kind && e[1] === sessionId).length;
}

const parent = '120363429412966849@g.us';
const msg = { id: 'false_parent_MSG001' };
const chatMsg = { id: 'false_parent_MSG002' };

const client = new FakeClient();
const state = makeState(parent, client);

registerSessionListeners(state, state.initGen, 'init', deps);

assert(state.listenerRegistry, 'registro inicial deve criar listenerRegistry');
assert.strictEqual(state.listenGen, 1);
assert.strictEqual(client.registeredCount('onMessage'), 1);
assert.strictEqual(client.registeredCount('onAnyMessage'), 1);
assert.strictEqual(client.registeredCount('onStateChange'), 1);
assert.strictEqual(state.listenerRegistry.reason, 'init');
assert.strictEqual(state.listenerRegistry.entries.onMessage.kind, 'onMessage');
assert.strictEqual(state.listenerRegistry.entries.onAnyMessage.kind, 'onAnyMessage');
assert.strictEqual(state.listenerRegistry.entries.onStateChange.kind, 'onStateChange');
assert(
  recorder.some(
    (e) =>
      e[0] === 'info' &&
      e[1].includes(`[${parent}] listener onMessage registrado`) &&
      e[1].includes('init #1') &&
      e[1].includes('motivo: init')
  ),
  'log de registro deve conter geração e motivo'
);
assert(
  recorder.some(
    (e) =>
      e[0] === 'monitor' &&
      e[1].includes('listener monitor (Grupo Mãe → Filho)') &&
      e[1].includes('init #1') &&
      e[1].includes('motivo: init')
  ),
  'log monitor de registro deve conter geração e motivo'
);

client.emit('onAnyMessage', msg);
client.emit('onMessage', chatMsg);
assert.strictEqual(countPayload('replicate', parent), 1, 'mensagem da página deve replicar 1x');
assert.strictEqual(count('registerMessage'), 1, 'onMessage sincronizado deve processar 1x');

const firstCallbacks = client.calls.slice();
const firstListenGen = state.listenGen;

reset();
state.listenerRegistry.at = Date.now() - LISTENER_FORCE_SKIP_MS - 1000;

ensureSessionListeners(state, 'socket CONNECTED', { force: true }, deps);

assert(state.listenerRegistry, 're-registro deve manter registry');
assert.strictEqual(state.listenGen, firstListenGen + 1, 're-registro deve avançar listenGen');
assert.strictEqual(client.registeredCount('onMessage'), 1, 'sem duplicar listener após re-registro');
assert.strictEqual(client.registeredCount('onAnyMessage'), 1, 'sem duplicar listener do monitor');
assert.strictEqual(client.registeredCount('onStateChange'), 1, 'sem duplicar onStateChange');
assert(count('info') >= 1, 're-registro deve logar');

const oldAnyMessageCb = firstCallbacks.find((c) => c.kind === 'onAnyMessage').cb;
const oldOnMessageCb = firstCallbacks.find((c) => c.kind === 'onMessage').cb;
const oldStateChangeCb = firstCallbacks.find((c) => c.kind === 'onStateChange').cb;

reset();
oldAnyMessageCb(msg);
assert.strictEqual(countPayload('replicate', parent), 0, 'listener antigo (registro anterior) deve ser invalidado');
oldOnMessageCb(chatMsg);
assert.strictEqual(count('registerMessage'), 0, 'onMessage antigo deve ser invalidado');
oldStateChangeCb('CONNECTED');
assert.strictEqual(count('socketState'), 0, 'onStateChange antigo deve ser invalidado');

client.emit('onAnyMessage', msg);
assert.strictEqual(countPayload('replicate', parent), 1, 'listener atual (novo) deve receber 1x por evento');
client.emit('onAnyMessage', msg);
assert.strictEqual(countPayload('replicate', parent), 2, 'cada evento de página gera exatamente 1 replicação (dedupe real fica no pipeline)');

client.emit('onStateChange', 'CONNECTED');
assert(
  recorder.some(
    (e) => e[0] === 'socketState' && e[1] === parent && e[2] === state.initGen && e[3] === 'CONNECTED'
  ),
  'novo onStateChange deve repassar estados'
);

reset();
state.listenerRegistry.at = Date.now() - LISTENER_FORCE_SKIP_MS - 1000;
ensureSessionListeners(state, 'socket CONNECTED', { force: true }, deps);
assert.strictEqual(state.listenGen, firstListenGen + 2, 'force além da janela anti-churn deve re-registrar');
assert(count('info') >= 1, 're-registro por force deve logar');

reset();
state.listenerRegistry.at = Date.now() - LISTENER_REFRESH_MS - 1000;
ensureSessionListeners(state, 'watchdog healthcheck', {}, deps);
assert.strictEqual(state.listenGen, firstListenGen + 3, 'staleness do watchdog deve re-registrar');
assert(count('info') >= 1);

reset();
ensureSessionListeners(state, 'socket CONNECTED', { force: true }, deps);
assert.strictEqual(state.listenGen, firstListenGen + 3, 'force recente deve pular re-registro');
assert.strictEqual(count('info'), 0);

const freshListenGen = state.listenGen;
reset();
ensureSessionListeners(state, 'init', {}, deps);
assert.strictEqual(state.listenGen, freshListenGen, 'registry fresco, sem force, não re-registra');

const secondClient = new FakeClient();
state.client = secondClient;
reset();
ensureSessionListeners(state, 'status MAIN/isLogged', { force: true }, deps);
assert.strictEqual(state.listenGen, freshListenGen + 1, 'troca de cliente deve re-registrar');
assert.strictEqual(secondClient.registeredCount('onAnyMessage'), 1, 'novo cliente recebe listener');
client.emit('onAnyMessage', msg);
client.emit('onStateChange', 'CONNECTED');
assert.strictEqual(countPayload('replicate', parent), 0, 'cliente antigo continua ignorado');
assert.strictEqual(count('socketState'), 0, 'onStateChange do cliente antigo ignorado');

clearSessionListenerRegistry(state, 'destroy', deps);
assert.strictEqual(state.listenerRegistry, null);
assert.strictEqual(secondClient.registeredCount('onAnyMessage'), 0, 'destroy deve remover listeners do cliente atual');
assert.strictEqual(secondClient.registeredCount('onStateChange'), 0);

state.client = null;
reset();
const noClient = ensureSessionListeners(state, 'sem cliente', {}, deps);
assert.strictEqual(noClient, null);
assert(count('info') >= 1, 'sem cliente deve logar ignorado');

registerSessionListeners(state, state.initGen, 'sem cliente', deps);
assert.strictEqual(state.listenerRegistry, null, 'registro sem cliente não cria registry');

console.log('sessionListeners: testes OK');