FROM node:22.22.3-bookworm-slim

# git and gh are required by Factory's sandbox (clone, push, open PRs); the rest are
# what coding agents reach for when they run a repo's checks in the local sandbox.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git gnupg openssh-client ripgrep python3 make g++ \
 && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /usr/share/keyrings/githubcli.gpg \
 && echo "deb [signed-by=/usr/share/keyrings/githubcli.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
 && apt-get update && apt-get install -y --no-install-recommends gh \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

# The Factory app lives in app/ (vendored from mastra-ai/softwarefactory-template; see
# README for the upstream base commit). Install from the lockfile first for layer caching.
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
RUN npm run build && npm cache clean --force

ENV NODE_ENV=production PORT=4111 MASTRA_HOST=:: MASTRA_APP_DATA_DIR=/data/app MASTRACODE_LOCAL_SANDBOX_ROOT=/data/sandboxes HOME=/data/home
EXPOSE 4111
WORKDIR /app/.mastra/output
CMD ["/bin/sh", "-c", "mkdir -p /data/app /data/sandboxes /data/home && exec node index.mjs"]
