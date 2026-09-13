'use strict';

const express = require('express');

function createChannelConfigRouter({ store }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ ok: true, channels: store.list() });
  });

  router.get('/:sessionId/:groupId', (req, res) => {
    const { sessionId, groupId } = req.params;
    res.json({ ok: true, config: store.get(sessionId, groupId) });
  });

  router.put('/:sessionId/:groupId', (req, res) => {
    const { sessionId, groupId } = req.params;
    if (!sessionId || !groupId) {
      res.status(400).json({ ok: false, error: 'Sessão e grupo são obrigatórios.' });
      return;
    }
    const config = store.set(sessionId, groupId, req.body || {});
    res.json({ ok: true, config });
  });

  return router;
}

module.exports = { createChannelConfigRouter };
