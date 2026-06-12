FROM oven/bun:1.3-alpine
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/primarybackend ./apps/primarybackend

RUN bun install

WORKDIR /app/packages/db
RUN bun x prisma generate

WORKDIR /app/apps/primarybackend
EXPOSE 3000
CMD ["bun", "run", "index.ts"]
