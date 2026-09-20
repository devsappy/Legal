# Next.js app in standalone mode. Build from the repository root so the shared
# package is in context:
#   docker build -f apps/frontend/Dockerfile --build-arg BACKEND_URL=http://backend:4000 -t sahayak-frontend .
# BACKEND_URL is read at build time because the /api/* rewrite is compiled into the route manifest.
FROM node:22-bookworm-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace apps/frontend

FROM node:22-bookworm-slim AS build
ARG BACKEND_URL=http://backend:4000
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend
WORKDIR /repo/apps/frontend
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1 BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM node:22-bookworm-slim AS run
ARG BACKEND_URL=http://backend:4000
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 BACKEND_URL=$BACKEND_URL
# The standalone output mirrors the monorepo: apps/frontend/server.js + a pruned node_modules
COPY --from=build /repo/apps/frontend/.next/standalone ./
COPY --from=build /repo/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /repo/apps/frontend/public ./apps/frontend/public
COPY --from=build /repo/apps/frontend/messages ./apps/frontend/messages
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
