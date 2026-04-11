# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install frontend deps
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Output: /app/dist


# ── Stage 2: Production server ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install server deps (production only)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source
COPY server/ ./server/

# Copy compiled frontend from builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT (default 8080); honour it
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# node v22+ has stable sqlite; v20 still needs the flag
CMD ["node", "--experimental-sqlite", "server/index.js"]
