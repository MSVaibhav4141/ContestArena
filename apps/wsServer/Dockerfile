FROM node:20-alpine AS base
RUN apk update
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat
RUN npm i -g bun

WORKDIR /app


FROM base AS prepare
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune wsServer --docker

FROM base AS builder
COPY --from=prepare /app/out/json .
RUN pnpm install
COPY --from=prepare /app/out/full/ .

WORKDIR /app/apps/wsServer/src

CMD ["bun", "index.ts"]