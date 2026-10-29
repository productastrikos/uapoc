# U-APOC web app — a static Vite/React build served by nginx.
#
#   docker build -t uapoc .
#   docker run --rm -p 8080:80 uapoc        # then open http://localhost:8080
#
# or simply:  docker compose up --build

# ---- Stage 1: build the static files ---------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Playwright is a devDependency (used for local screenshots only); never let it
# download browsers into the image.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Dependencies first, so this layer is cached until package*.json changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* values into the JavaScript at build time — they are NOT
# read when the container starts. To point the app at a different broker,
# rebuild with different build args (docker compose does this from .env).
# The defaults below are the public test broker, so a plain `docker build`
# works with no arguments. See .env.example for what each one means.
ARG VITE_MQTT_URL=wss://broker.hivemq.com:8884/mqtt
ARG VITE_MQTT_TOPIC_PREFIX=astrikedge
ARG VITE_MQTT_NODE_ID=pantherlake01
ARG VITE_MQTT_USERNAME=
ARG VITE_MQTT_PASSWORD=
ENV VITE_MQTT_URL=$VITE_MQTT_URL \
    VITE_MQTT_TOPIC_PREFIX=$VITE_MQTT_TOPIC_PREFIX \
    VITE_MQTT_NODE_ID=$VITE_MQTT_NODE_ID \
    VITE_MQTT_USERNAME=$VITE_MQTT_USERNAME \
    VITE_MQTT_PASSWORD=$VITE_MQTT_PASSWORD

# `vite build` only — not `tsc`, which still reports pre-existing unused-import
# warnings that don't affect the output.
RUN npm run build

# ---- Stage 2: serve it ------------------------------------------------------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
