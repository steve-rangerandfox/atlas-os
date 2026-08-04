# Atlas certified dev image for {{PROJECT_NAME}}.
#
# Based on the official Playwright image matching the RESOLVED browser version
# from the lockfile, so browsers AND their OS libraries are already present —
# that is the part hand-rolled setup scripts get wrong.
#
# Dependencies are baked at build time, keyed to the lockfile hash. At steady
# state the agent needs no package-registry network access at all.
FROM mcr.microsoft.com/playwright:v{{PLAYWRIGHT_VERSION}}-noble

ARG NODE_MAJOR={{NODE_MAJOR}}
ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=development \
    CI=1 \
    npm_config_fund=false \
    npm_config_audit=false

# Pin the Node major explicitly. The base image ships a Node, but the project's
# declared pin is the authority — never "whatever the image happens to have".
RUN set -eux; \
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -; \
    apt-get install -y --no-install-recommends nodejs git jq ca-certificates; \
    rm -rf /var/lib/apt/lists/*; \
    node --version; npm --version

WORKDIR /workspace

# Bake dependencies. Lifecycle scripts are disabled: a postinstall is an
# execution vector, and nothing in a dependency tree needs to run at image build.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Playwright browsers live in the base image; point the runtime at them and
# stop any npm postinstall from re-downloading.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY . .
