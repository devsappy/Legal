# Next.js app in standalone mode. The model servers run as separate
# containers (see docker-compose.yml) or on the host.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Content the server reads at runtime
COPY --from=build /app/corpus ./corpus
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/messages ./messages
RUN mkdir -p /app/data && chown -R node:node /app
USER node
VOLUME ["/app/data", "/app/corpus"]
EXPOSE 3000
CMD ["node", "server.js"]
