# Postgres, the API and the web app in one container, served on :7860 (Render, Hugging Face Space, Docker host).
# With compose (published on host port 3034):  docker compose up -d --build
# Plain Docker:  docker build -t al-hail-demo . && docker run --rm -p 3034:7860 -e GEMINI_API_KEY=... al-hail-demo

FROM node:22-slim AS web
WORKDIR /web
RUN npm install -g pnpm@12.9.1
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
# The browser calls the API on the same origin; nginx forwards /api to FastAPI.
ENV NEXT_PUBLIC_API_URL=/api NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM python:3.12-slim
# Debian package mirror; override when the default CDN is slow from the build host.
ARG DEBIAN_MIRROR=deb.debian.org
RUN sed -i "s|deb.debian.org|$DEBIAN_MIRROR|g" /etc/apt/sources.list.d/debian.sources \
 && apt-get update \
 && apt-get install -y --no-install-recommends postgresql nginx curl \
 && rm -rf /var/lib/apt/lists/*
COPY --from=web /usr/local/bin/node /usr/local/bin/node
RUN useradd -m -u 1000 user
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
# Python package index; override with a mirror when pypi.org is slow from the build host.
ARG PIP_INDEX_URL=https://pypi.org/simple
# Downloads are kept in a build cache and the install is retried, so each attempt (and each later
# build) continues from what was already fetched.
RUN --mount=type=cache,target=/root/.cache/pip \
    for i in 1 2 3 4 5; do \
      pip install --default-timeout=120 --retries 10 -r backend/requirements.txt && break; \
      [ "$i" = 5 ] && exit 1; echo "pip install failed, retrying ($i/5)"; \
    done
COPY backend/ backend/
COPY deploy/ deploy/
COPY --from=web /web web/
RUN chown -R user:user /app
USER user
ENV HOME=/home/user \
    PGDATA=/home/user/pgdata \
    DATABASE_URL=postgresql://demo@127.0.0.1:5432/demos \
    API_PORT=8000 \
    NEXT_TELEMETRY_DISABLED=1
# Bake the seeded database and source PDFs into the image: a cold start only starts the servers,
# and every container begins from this same fresh data.
RUN bash deploy/run.sh --seed-only
EXPOSE 7860
CMD ["bash", "deploy/run.sh"]
