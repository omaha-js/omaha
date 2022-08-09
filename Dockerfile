# Stage 1: Workspace

FROM node:16 AS workspace

RUN npm install -g pnpm && \
	curl -sf https://gobinaries.com/tj/node-prune | sh

WORKDIR /srv/app

COPY ./package*.json ./
COPY ./pnpm-*.yaml ./
COPY ./packages/omaha-api/package*.json ./packages/omaha-api/
COPY ./packages/omaha-api/tsconfig*.json ./packages/omaha-api/
COPY ./packages/omaha-web/package*.json ./packages/omaha-web/
COPY ./packages/omaha-web/tsconfig*.json ./packages/omaha-web/
COPY ./packages/omaha-web/vite.*.ts ./packages/omaha-web/
COPY ./tsconfig*.json ./

RUN pnpm install

# Stage 2: Build omaha-web

FROM workspace AS build-web
WORKDIR /srv/app/packages/omaha-web

COPY ./packages/omaha-web/src ./src
COPY ./packages/omaha-web/public ./public
COPY ./packages/omaha-web/index.html ./

RUN pnpm run build && rm -rf src

# Stage 3: Build omaha-api

FROM build-web AS build-api
WORKDIR /srv/app/packages/omaha-api

COPY ./packages/omaha-api/src ./src
COPY ./packages/omaha-api/templates ./templates

RUN pnpm run build

# Stage 4: Prune

FROM build-api AS pruned
WORKDIR /srv/app
RUN rm -rf node_modules && \
	pnpm --filter omaha-api --prod deploy pruned && \
	/usr/local/bin/node-prune pruned/node_modules

# Stage 5: Production

FROM node:16-alpine
WORKDIR /srv/app
ENV NODE_ENV=production

COPY --from=pruned /srv/app/pruned ./

RUN mkdir storage && chown 1000 storage && chgrp 1000 storage && \
	mkdir temp && chown 1000 temp && chgrp 1000 temp

USER 1000
ENTRYPOINT ["node", "--expose-gc", "dist/main.js"]
