FROM oven/bun:1.3-alpine
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/ws_layer ./apps/ws_layer

RUN bun install

WORKDIR /app/apps/ws_layer
EXPOSE 9093
CMD ["bun", "run", "index.ts"]
