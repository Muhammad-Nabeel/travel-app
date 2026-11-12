# Multi-stage build.
#   docker build .              → production image (next build, standalone server)
#   docker compose up           → "dev" target with the source mounted (see docker-compose.yml)
# Secrets are never baked in: .dockerignore excludes every .env* file, and the
# runtime reads them from the environment (env_file / the host's secret store).

FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# ── Development: hot reload against the mounted source ───────────────────────
FROM deps AS dev
COPY . .
RUN npx prisma generate
EXPOSE 3004
CMD ["npm", "run", "dev"]

# ── Production build ──────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Production runtime: only the standalone server and static assets ────────
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3004 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /usr/src/app/public ./public
USER nextjs
EXPOSE 3004
CMD ["node", "server.js"]
