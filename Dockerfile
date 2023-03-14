# Stage 1: Workspace

FROM node:18-alpine AS workspace
WORKDIR /srv/app

COPY pnpm-*.yaml ./
COPY package*.json ./
COPY packages/omaha-api/package*.json ./packages/omaha-api/
COPY packages/omaha-web/package*.json ./packages/omaha-web/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY tsconfig*.json ./

# Stage 2: Build omaha-web

FROM workspace AS builder-web
WORKDIR /srv/app/packages/omaha-web

COPY packages/omaha-web/tsconfig*.json ./
COPY packages/omaha-web/vite.*.ts ./
COPY packages/omaha-web/index.html ./
COPY packages/omaha-web/public ./public
COPY packages/omaha-web/src ./src

RUN pnpm run build && rm -rf src && rm -rf public && rm -rf node_modules

# Stage 3: Build omaha-api

FROM workspace AS builder-api
WORKDIR /srv/app/packages/omaha-api

COPY packages/omaha-api/tsconfig*.json ./
COPY packages/omaha-api/templates ./templates
COPY packages/omaha-api/src ./src

RUN pnpm run build && rm -rf src && rm -rf node_modules

# Stage 4: Merge packages & prune dependencies

FROM workspace AS deploy
WORKDIR /srv/app

RUN rm -rf node_modules && pnpm --filter omaha-api --prod deploy build
COPY --from=builder-web /srv/app/packages/omaha-web ./build/node_modules/@omaha/omaha-web
COPY --from=builder-api /srv/app/packages/omaha-api ./build

# Stage 5: Production

FROM node:18-alpine
WORKDIR /srv/app

COPY --from=deploy /srv/app/build ./

RUN mkdir storage && \
	chown 1000 storage && \
	chgrp 1000 storage && \
	mkdir temp && \
	chown 1000 temp && \
	chgrp 1000 temp

USER 1000

ARG TAG dev
ENV TAG $TAG
ENV NODE_ENV production

ENTRYPOINT ["node", "--expose-gc", "dist/main.js"]
