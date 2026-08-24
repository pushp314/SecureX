# Multi-stage production build for SecureX Backend Engine

# Stage 1: Build & Compile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code
COPY src ./src/

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy package manifests and production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy generated Prisma client and compiled output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

# Create runtime non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
