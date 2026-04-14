# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Build-time secrets passed from CI via --build-arg (never baked into the image layer)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

# Expose them to Vite during the build step only
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

# Install frontend deps
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Output: /app/dist
# Note: VITE_* values are compiled into dist/ — the builder stage is discarded after


# ── Stage 2: Production server ────────────────────────────────────────────────
FROM node:22-alpine AS runner

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

# node:sqlite requires Node 22+ (introduced in v22.5.0); --experimental-sqlite flag required until v22.15 / v23.4
CMD ["node", "--experimental-sqlite", "server/index.js"]
