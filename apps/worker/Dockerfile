FROM oven/bun:1.3-alpine
RUN apk add --no-cache nodejs npm
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN bun install

WORKDIR /app/packages/db
RUN bun x prisma generate

WORKDIR /app/apps/worker
EXPOSE 9091
CMD ["bun", "run", "index.ts"]
