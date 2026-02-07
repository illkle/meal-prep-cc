FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
WORKDIR /app

COPY . .
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY package.json ./

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
