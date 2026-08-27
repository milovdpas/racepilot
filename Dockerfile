# RacePilot — Next.js server (not a static SPA).
#
# It cannot be built as a static bundle behind plain nginx: `app/api/*` are
# Route Handlers doing Google OAuth, Drive and weather, and `middleware.ts`
# runs per request. So this follows the VPS guide's "API / server process"
# pattern: the container's CMD is the process, no PM2, no systemd.

# ---- build ----------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The site's own public origin. This is a BUILD arg, not a runtime variable —
# the same trap the guide flags for VITE_*: `NEXT_PUBLIC_*` is inlined into the
# bundle, and "/", "/privacy", the sitemap and robots.txt are prerendered at
# build time, so their canonical URLs are baked in here. Changing the domain
# means rebuilding the image, not editing .env.
#
# Leave it unset and lib/site.ts fails closed: the app marks itself noindex
# rather than advertising http://localhost:3000 as its canonical URL.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Shows the "buy me a water" button in Settings. Off unless set to 1, so a
# self-hosted copy never ships a donate link pointing at someone else's
# account. Build-time for the same reason as the URL above: it is inlined into
# the client bundle, so flipping it means rebuilding, not editing .env.
ARG NEXT_PUBLIC_DONATE_LINK_ENABLED
ENV NEXT_PUBLIC_DONATE_LINK_ENABLED=$NEXT_PUBLIC_DONATE_LINK_ENABLED

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- run ------------------------------------------------------------------
FROM node:24-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Port 80 inside the container, matching every other app on the proxy network.
ENV PORT=80
ENV HOSTNAME=0.0.0.0

# `output: "standalone"` traces exactly the dependencies the server needs, so
# node_modules never enters this stage. The other two COPYs are not optional:
# standalone deliberately excludes both, and without them every asset and the
# manifest 404.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Don't run as root. The image is read-only at runtime — the app has no
# database and writes nothing to disk.
USER node

EXPOSE 80

# 127.0.0.1, not localhost: the Next server binds IPv4-only (HOSTNAME above),
# while BusyBox wget resolves "localhost" to ::1 first and gets connection
# refused. The container then reports unhealthy while serving traffic perfectly.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1

CMD ["node", "server.js"]
