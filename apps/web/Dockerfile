FROM node:20-alpine AS base
RUN apk update
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

WORKDIR /app

FROM base AS prepare
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune web --docker

FROM base AS builder
COPY --from=prepare /app/out/json .
RUN pnpm install
COPY --from=prepare /app/out/full/ .
RUN --mount=type=secret,id=database_url \
    --mount=type=secret,id=redis_url \
    DATABASE_URL=$(cat /run/secrets/database_url) \
    REDIS_URL=$(cat /run/secrets/redis_url) \
    pnpm turbo build

FROM base AS runner
RUN apk add --no-cache ca-certificates  
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js