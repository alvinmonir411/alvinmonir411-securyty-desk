# Production Deployment & Operations Guide
**School Management System (SMS) — Enterprise Edition**

---

## 1. System Architecture Overview

```
[ Internet / Clients ]
         │
         ├──► Next.js 16+ Frontend (Port 3000 / CDN Edge)
         │        │ (SSR / TanStack Query / Edge Middleware)
         │        ▼
         └──► NestJS Backend REST API (Port 4000)
                  │
                  ├──► Neon Serverless PostgreSQL (Pooler & Direct)
                  ├──► Twilio / AWS SNS (SMS Engine)
                  └──► SendGrid / SMTP (Email Engine)
```

---

## 2. Neon Serverless PostgreSQL Setup

1. **Create Neon Project**:
   - Go to [Neon Console](https://console.neon.tech) and create a new database project: `school-management-system`.
   - Set PostgreSQL version to **16+**.
2. **Retrieve Connection Strings**:
   - **Pooled Connection String** (for backend queries under serverless scaling):
     `postgresql://<user>:<password>@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - **Direct Connection String** (required for Prisma schema migrations):
     `postgresql://<user>:<password>@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. **Database Migration**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
4. **Seed Database**:
   ```bash
   cd backend
   npm run seed
   ```

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
|---|---|---|
| `PORT` | Application HTTP Port | `4000` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGIN` | Allowed Frontend Origin | `https://apexacademy.edu` |
| `DATABASE_URL` | Neon Pooled connection URL | `postgresql://...-pooler.../neondb?sslmode=require` |
| `DIRECT_URL` | Neon Direct connection URL | `postgresql://.../neondb?sslmode=require` |
| `JWT_ACCESS_SECRET` | Secret key for 15-min access tokens | Minimum 32 characters random string |
| `JWT_REFRESH_SECRET` | Secret key for 7-day refresh tokens | Minimum 32 characters random string |
| `JWT_ACCESS_EXPIRATION` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan | `7d` |
| `THROTTLE_TTL` | Rate limit window in seconds | `60` |
| `THROTTLE_LIMIT` | Maximum requests per window | `120` |
| `TWILIO_ACCOUNT_SID` | Twilio SMS API SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Secret Token | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER`| Registered Twilio Sender Phone | `+15550001122` |
| `SMTP_HOST` | Transactional Email SMTP Host | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP Port (TLS) | `587` |
| `SMTP_USER` | SMTP Username | `apikey` |
| `SMTP_PASS` | SMTP Password / API Key | `SG.xxxxxxxx` |
| `SMTP_FROM` | Outgoing sender email address | `no-reply@apexacademy.edu` |

### Frontend (`frontend/.env.local` or Vercel Environment)
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST API endpoint | `https://api.apexacademy.edu/api/v1` |
| `NEXT_PUBLIC_SITE_URL`| Canonical public website URL | `https://apexacademy.edu` |

---

## 4. Production Build & Execution Commands

### Backend (NestJS)
```bash
# 1. Install production dependencies
npm ci

# 2. Build production bundle
npm run build

# 3. Start production server
node dist/main.js
```

### Frontend (Next.js 16+)
```bash
# 1. Install production dependencies
npm ci

# 2. Compile optimized production build
npm run build

# 3. Launch Next.js production server
npm run start -p 3000
```

---

## 5. Production Deployment Workflows

### Option A: Vercel + Railway
1. **Frontend (Vercel)**:
   - Connect repository root pointing to `school-management-system/frontend`.
   - Set environment variables `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`.
   - Framework preset: **Next.js**.
2. **Backend (Railway / Render)**:
   - Root directory: `school-management-system/backend`.
   - Build command: `npm run build && npx prisma migrate deploy`.
   - Start command: `node dist/main.js`.

### Option B: Docker Container Deployment
```dockerfile
# Backend Dockerfile snippet
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main.js"]
```

---

## 6. Backup & Disaster Recovery Strategy

1. **Neon Continuous Point-In-Time Restore (PITR)**:
   - Neon maintains continuous Write-Ahead Log (WAL) history.
   - You can restore to any second within the past 7 to 30 days via the Neon console or CLI.
2. **Automated Daily Snapshot Backups (`pg_dump`)**:
   ```bash
   pg_dump "$DIRECT_URL" --format=custom --file="backups/sms_backup_$(date +%Y%m%d_%H%M%S).dump"
   ```
3. **Audit Log Retention**:
   - `AuditLog` table records all mutations with actor, timestamp, before/after states.

---

## 7. Monitoring & Health Telemetry

1. **Health Endpoint**:
   - Endpoint: `GET /api/v1/health`
   - Returns database latency, memory RSS, uptime, and system status.
2. **Application Performance Monitoring (APM)**:
   - Sentry / OpenTelemetry integration for runtime unhandled exceptions.
   - Next.js Analytics & Vercel Speed Insights for Core Web Vitals (LCP, FID, CLS).
