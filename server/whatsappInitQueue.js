'use strict';

// ===== Fila global FIFO de inicialização WPPConnect =====
// Garante que no máximo UMA sessão está em fase de inicialização pesada
// (create()/recreate()/recover-qr) por vez. Motivação: cada create() lança um
// Chromium (~300 MB); várias inicializações simultâneas estouravam a memória do
// Railway e travavam o WPPConnect antes do catchQR ("wapi.js failed /
// TimeoutError: Waiting failed"). Com a fila, a sessão seguinte só abre o
// Chromium depois que a atual gerar QR real, conectar ou falhar de vez.
//
// O lock NUNCA é segurado enquanto o usuário fica olhando o QR: assim que o QR
// real aparece (ou o cliente conecta / falha), a fila é liberada e a próxima
// sessão aguardando é promovida imediatamente.
function createInitQueue() {
  let seq = 0;
  let activeToken = null;
  const waiters = [];

  // Solicita o slot global. Resolve IMEDIATAMENTE quando a fila está livre;
  // caso contrário resolve quando o detentor atual liberar (FIFO).
  function acquire() {
    const token = { id: ++seq };
    return new Promise((resolve) => {
      if (!activeToken) {
        activeToken = token;
        resolve(token);
      } else {
        waiters.push({ token, resolve });
      }
    });
  }

  // Libera o slot. Somente o detentor ATUAL consegue liberar (release é
  // idempotente: QR, conectado e erro podem disparar em sequência; o primeiro
  // vence e os demais são ignorados). Promove o próximo da fila, se houver.
  // Retorna true quando um próximo aguardando foi promovido.
  function release(token) {
    if (!activeToken || activeToken !== token) return false;
    const next = waiters.shift();
    if (next) {
      activeToken = next.token;
      next.resolve(next.token);
      return true;
    }
    activeToken = null;
    return false;
  }

  return {
    acquire,
    release,
    get active() {
      return activeToken;
    },
    get pending() {
      return waiters.length;
    },
  };
}

module.exports = { createInitQueue };