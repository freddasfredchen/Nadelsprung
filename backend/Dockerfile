FROM oven/bun:1.1-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Generate and run migrations, then start
CMD ["sh", "-c", "bun run src/db/seed.ts && bun run src/index.ts"]

EXPOSE 3001
