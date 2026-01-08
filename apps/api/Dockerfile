FROM node:22-alpine AS base

# Install git for vault operations
RUN apk add --no-cache git

RUN npm install -g pnpm
WORKDIR /app

# Copy workspace manifests so pnpm can resolve workspaces with the root lockfile
# (Build context must be repository root for this to work)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./

# Copy all packages and apps (needed for workspace resolution)
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies for all workspace packages (needed for type checking)
RUN pnpm install --no-frozen-lockfile --prod=false

# Build mcp first (api depends on its tools)
RUN pnpm --filter ./apps/mcp run build

# Build the api package
RUN pnpm --filter ./apps/api run build

ENV PORT=4300
ENV HOST=0.0.0.0
ENV VAULT_PATH=/vault
ENV VAULT_ROOT=/vault
ENV NODE_ENV=production
ENV AUTH_ENABLED=false

RUN mkdir -p /vault
VOLUME /vault

# Configure git to allow operations on /vault (may be owned by different user)
RUN echo '[safe]' > /etc/gitconfig && echo '  directory = /vault' >> /etc/gitconfig

WORKDIR /app/apps/api
EXPOSE 4300

CMD ["pnpm", "start"]
