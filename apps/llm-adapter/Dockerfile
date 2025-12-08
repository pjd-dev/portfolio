FROM node:18-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

FROM base AS build
WORKDIR /app
# Copy package manifest and install dependencies (if any)
COPY package.json ./
RUN pnpm install --no-frozen-lockfile --silent || true
COPY . .

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
EXPOSE 3000
CMD ["node","index.js"]
