ARG BUN_VERSION=1.2

FROM oven/bun:${BUN_VERSION}-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* bun.lockb* ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:${BUN_VERSION}-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "server.js"]
