# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── dependencies (cached until package files / schema change) ──
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── build: generate Prisma client, compile TypeScript, drop dev dependencies ──
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ── runtime image ──
FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./package.json
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
