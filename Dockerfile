FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js inlines NEXT_PUBLIC_* vars at build time
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_QENCODE_PLAYER_LICENSE=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_QENCODE_PLAYER_LICENSE=$NEXT_PUBLIC_QENCODE_PLAYER_LICENSE

# Dummy secrets needed for Next.js page data collection during build
# (real values are injected at runtime via environment variables)
ENV NEXTAUTH_SECRET=build-placeholder
ENV CALLBACK_SIGNING_SECRET=build-placeholder
ENV AUTH_TRUST_HOST=true

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Full node_modules first (needed for prisma migrate deploy + all transitive deps).
# Prisma v6 CLI pulls in @prisma/config → effect, c12, deepmerge-ts, etc.
COPY --from=deps /app/node_modules ./node_modules

# Next.js standalone output overwrites its own node_modules subset
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migration files
COPY prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
