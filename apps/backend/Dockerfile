# API server. Build from the repository root so the shared package is in context:
#   docker build -f apps/backend/Dockerfile -t sahayak-backend .
FROM node:22-bookworm-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace apps/backend --omit=dev

FROM node:22-bookworm-slim AS run
WORKDIR /repo
ENV NODE_ENV=production PORT=4000 HOST=0.0.0.0
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
WORKDIR /repo/apps/backend
RUN mkdir -p data && chown -R node:node /repo
USER node
# data/ holds the embedding index; the database is Postgres (DATABASE_URL)
VOLUME ["/repo/apps/backend/data", "/repo/apps/backend/corpus"]
EXPOSE 4000
CMD ["npx", "tsx", "src/server.ts"]
