FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

COPY prisma ./prisma
# Generate Prisma client BEFORE copying src or building
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Must also generate in production image — the generated client goes in node_modules
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

EXPOSE 3030

CMD ["node", "dist/src/server.js"]