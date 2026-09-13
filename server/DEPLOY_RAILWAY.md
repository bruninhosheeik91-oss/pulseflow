# Deploy do backend WhatsApp no Railway

O frontend permanece na Vercel. Este diretório deve ser publicado como um serviço persistente no Railway.

## Configuração do serviço

- Root Directory: `/server`
- Builder: Dockerfile
- Porta: usar `PORT` injetada pelo Railway
- Volume persistente montado em `/data`

## Variáveis obrigatórias

- `HOST=0.0.0.0`
- `PULSEFLOW_STATE_DIR=/data`
- `WPP_CHROME_PATH=/usr/bin/chromium`
- `ENCRYPTION_KEY=<mesma chave usada no backend atual>`

Não copie `server/.env`, tokens ou segredos para o Git.

## Persistência

O volume `/data` mantém:

- `/data/tokens` — sessão WPPConnect/WhatsApp
- `/data/data` — configurações, automações e dados persistidos do backend

Após o primeiro pareamento por QR, reinícios do container reutilizam a sessão persistida.

## Frontend Vercel

Depois de o Railway fornecer o domínio HTTPS do backend, defina no projeto Vercel:

`VITE_WPP_BACKEND_URL=https://SEU-BACKEND.up.railway.app`

Faça um novo deploy do frontend após alterar a variável.
