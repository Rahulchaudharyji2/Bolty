FROM oven/bun:1.3-alpine
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend

RUN bun install

WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["bun", "run", "dev"]
