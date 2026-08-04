# Atlas certified dev image for {{PROJECT_NAME}}.
#
# Node is the BASE, not something installed on top of another image's Node.
# Starting from a Playwright image and apt-installing Node leaves that image's
# own Node earlier on PATH, where it silently wins — shipping a "certified"
# image with the wrong runtime and a dependency tree resolved under it.
# Choose a base whose toolchain is already correct; do not repair another
# image's toolchain.
#
# Browsers derive from the lockfile rather than from a hand-matched base-image
# tag, so the browser build cannot drift from the pinned browser package — and
# no registry tag variant needs verifying during adoption.
FROM node:{{NODE_MAJOR}}-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=development \
    CI=1 \
    npm_config_fund=false \
    npm_config_audit=false \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Assert the runtime before anything depends on it. A `node --version` that only
# prints is not verification — this build must FAIL on a wrong major rather than
# ship an image that looks certified and isn't.
RUN set -eux; \
    command -v -a node; \
    test "$(node -p 'process.versions.node.split(".")[0]')" = "{{NODE_MAJOR}}" \
      || { echo "FATAL: node $(node --version) is not major {{NODE_MAJOR}}"; exit 1; }; \
    apt-get update; \
    apt-get install -y --no-install-recommends git jq ca-certificates curl; \
    rm -rf /var/lib/apt/lists/*; \
    node --version; npm --version

WORKDIR /workspace

# Lifecycle scripts stay disabled: a postinstall is an execution vector and
# nothing in a dependency tree needs to run while building an image.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Browsers and their OS libraries, at the version the lockfile pins.
RUN ./node_modules/.bin/playwright install --with-deps {{BROWSERS}} \
    && ./node_modules/.bin/playwright --version

COPY . .

# SCOPE: these baked dependencies serve the devcontainer, where the working
# directory IS /workspace. GitHub Actions mounts the repository at
# /__w/<repo>/<repo>, so Node resolution never reaches /workspace and CI must
# restore dependencies itself. The image's guarantee is the TOOLCHAIN — pinned
# Node, pinned browsers, OS libraries. The lockfile is the guarantee for
# dependencies. Do not claim the agent needs no registry access in CI.
