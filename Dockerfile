# Multi-stage Dockerfile for College Course Portal (Node standalone backend + SSR)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files & workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for standalone node server preset
RUN npm run build:node

# Production image stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy built server output from builder
COPY --from=builder /app/frontend/.output ./frontend/.output

EXPOSE 3000

CMD ["node", "frontend/.output/server/index.mjs"]
