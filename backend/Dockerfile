FROM oven/bun:1.1-alpine AS base

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY . .

CMD ["bun", "run", "src/index.ts"]

EXPOSE 3001
