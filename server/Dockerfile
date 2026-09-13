FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation procps \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    WPP_CHROME_PATH=/usr/bin/chromium \
    PULSEFLOW_STATE_DIR=/data

RUN mkdir -p /data/tokens /data/data

EXPOSE 3001

CMD ["npm", "start"]
