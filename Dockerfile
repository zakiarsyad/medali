# The campus server package: the app as one image. It holds no key, no
# password and no settings file; those are given on the server.

FROM node:24.21.0-slim AS base
WORKDIR /app
# The campus mark. With it the app is on the campus server whatever the
# other settings say: no Ganti peran and no sample data.
ENV MEDALI_CAMPUS=1
# pnpm, in the version package.json names, kept where the user the app
# runs as can read it, so the server never has to download it.
ENV COREPACK_HOME=/opt/corepack
COPY package.json ./
RUN corepack enable && corepack install

FROM base AS build
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["sh", "docker/campus-start.sh"]
