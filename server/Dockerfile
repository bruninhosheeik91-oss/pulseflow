FROM node:20-bookworm-slim

# Chromium real (headless) para o WPPConnect em produção.
RUN apt-get update && \
    apt-get install -y --no-install-recommends chromium && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Pina a versão do WhatsApp Web no interceptor do WPPConnect (aceita query string
# em navegação do documento principal). Falha o build se a assinatura do dist
# 2.3.3 não casar — nunca publica sem o patch.
RUN node scripts/patch-wppconnect-version-interceptor.js

# Valida o executável real do Chromium durante o build e persiste o caminho em
# /app/.env (server.js carrega o próprio .env no boot; variáveis já presentes no
# ambiente nunca são sobrescritas, então o deploy vence).
RUN CHROME_BIN="$(which chromium || which chromium-browser || which google-chrome)" && \
    echo "Chromium encontrado: ${CHROME_BIN}" && \
    echo "WPP_CHROME_PATH=${CHROME_BIN}" > .env

ENV HOST=0.0.0.0
ENV PULSEFLOW_STATE_DIR=/data

EXPOSE 3001

CMD ["node", "server.js"]