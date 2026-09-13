# WhatsApp Channels / Newsletter — integração inicial

O helper `server/whatsappNewsletters.js` já foi adicionado. Para expor a listagem de canais no backend, aplicar as duas alterações abaixo em `server/server.js`.

## 1. Importar o helper

Após o bloco que importa `createTenantAutoSearchSendsStore`, adicionar:

```js
const {
  listNewslettersForClient,
} = require('./whatsappNewsletters.js');
```

## 2. Adicionar rota por sessão

Logo após a rota `GET /api/whatsapp/:sessionId/groups`, adicionar:

```js
app.get(
  '/api/whatsapp/:sessionId/newsletters',
  resolveSessionId,
  requireConnectedSession,
  async (req, res) => {
    const sessionId = req.resolvedSessionId;
    try {
      const state = getSessionState(sessionId);
      const newsletters = await listNewslettersForClient(state.client);
      logWhatsApp(
        `[${sessionId}] newsletters reais carregadas = ${newsletters.length}`
      );
      res.json({
        ok: true,
        session: sessionId,
        newsletters,
        total: newsletters.length,
      });
    } catch (err) {
      logError(
        `[WhatsApp ${sessionId}] falha ao listar newsletters: ${String(
          (err && err.message) || err
        )}`
      );
      res.status(500).json({
        ok: false,
        error: 'Falha ao listar canais do WhatsApp.',
      });
    }
  }
);
```

## Teste

Com a conta principal conectada:

```text
http://localhost:3001/api/whatsapp/domnex-main/newsletters
```

Resultado esperado:

```json
{
  "ok": true,
  "session": "domnex-main",
  "newsletters": [
    {
      "id": "120363000000000000@newsletter",
      "name": "DOMNEX OFERTAS",
      "type": "newsletter",
      "isNewsletter": true
    }
  ],
  "total": 1
}
```

O próximo passo é usar o JID real de `DOMNEX OFERTAS` para um envio de teste e, depois, incluir newsletters em `/api/affiliate/auto-search/destinations`.
