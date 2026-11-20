FROM node:22-bookworm-slim AS deps
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/web/node_modules ./web/node_modules
COPY web ./web
COPY api ./api
COPY ybs_*.json ./
WORKDIR /app/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Default data root inside image; override with YBS_DATA_ROOT + bind mount for durable admin writes.
ENV YBS_DATA_ROOT=/app
COPY --from=builder /app/api ./api
COPY --from=builder /app/ybs_*.json ./
COPY --from=builder /app/web/package.json ./web/package.json
COPY --from=builder /app/web/package-lock.json ./web/package-lock.json
COPY --from=builder /app/web/node_modules ./web/node_modules
COPY --from=builder /app/web/public ./web/public
COPY --from=builder /app/web/.next ./web/.next
COPY --from=builder /app/web/next.config.ts ./web/next.config.ts
WORKDIR /app/web
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
