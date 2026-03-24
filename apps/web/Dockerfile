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
ARG DATABASE_URL
ARG REDIS_URL
ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
COPY --from=prepare /app/out/json .
RUN pnpm install
COPY --from=prepare /app/out/full/ .
RUN npx prisma db push --schema=packages/db/prisma/schema.prisma --skip-generate
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN pnpm turbo build 


FROM base AS runner
RUN apk add --no-cache ca-certificates  
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js