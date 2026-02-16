# Deploying AweTube

AweTube runs on DigitalOcean App Platform with Managed PostgreSQL, Qencode for video infrastructure, and GoDaddy for DNS. Two environments are supported: **QA** (`qa.awetube.ai`) and **Production** (`awetube.ai`).

## Architecture

```
feature/xyz ──PR──→ develop ──auto-deploy──→ qa.awetube.ai
                       │
                      PR
                       │
                      main ──manual-trigger──→ awetube.ai
```

```
┌──────────────┐     ┌──────────────────────────────┐
│   GoDaddy    │────→│     DigitalOcean              │
│  awetube.ai  │ DNS │                               │
│  qa.awetube  │     │  ┌────────┐   ┌────────────┐ │
└──────────────┘     │  │  Prod  │   │     QA     │ │
                     │  │ Next.js│   │  Next.js   │ │
                     │  │ Docker │   │  Docker    │ │
                     │  └───┬────┘   └─────┬──────┘ │
                     │      │              │        │
                     │  ┌───▼────┐   ┌─────▼──────┐ │
                     │  │ PG 16  │   │  PG 16     │ │
                     │  │ 1 GB   │   │  dev tier  │ │
                     │  └────────┘   └────────────┘ │
                     └──────────────────────────────┘
                               │
                     ┌─────────▼──────────┐
                     │   Qencode (shared) │
                     │  TUS Upload        │
                     │  Transcoding       │
                     │  S3 Storage        │
                     │  CDN Delivery      │
                     │  Video Player      │
                     └────────────────────┘
```

All responses pass through the security headers middleware (`src/middleware.ts`) which sets CSP, HSTS, X-Frame-Options, and other security headers on every non-static request.

## Prerequisites

- [DigitalOcean account](https://digitalocean.com) with billing set up
- [Qencode account](https://qencode.com) with API key and S3 media storage bucket
- [GoDaddy account](https://godaddy.com) with `awetube.ai` domain
- [doctl CLI](https://docs.digitalocean.com/reference/doctl/) installed and authenticated
- GitHub repo: `muradmordukhay/awetube`

---

## Initial Setup (one-time)

### 1. Generate secrets

Generate **two pairs** of cryptographic secrets (one for QA, one for Production):

```bash
# QA secrets
echo "QA NEXTAUTH_SECRET:"; openssl rand -base64 32
echo "QA CALLBACK_SIGNING_SECRET:"; openssl rand -base64 32

# Production secrets
echo "PROD NEXTAUTH_SECRET:"; openssl rand -base64 32
echo "PROD CALLBACK_SIGNING_SECRET:"; openssl rand -base64 32
```

`CALLBACK_SIGNING_SECRET` is used for HMAC-SHA256 callback signing with timestamp-based replay protection (5-minute window). See `src/lib/callback-signature.ts`.

### 2. Configure GitHub Secrets

Go to your repo **Settings > Secrets and variables > Actions**.

**Repo-level secrets** (shared across both environments):

| Secret | Source |
|--------|--------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DO dashboard > API > Personal Access Tokens |
| `QENCODE_API_KEY` | Qencode dashboard > API Keys |
| `QENCODE_S3_BUCKET` | Qencode dashboard > Media Storage |
| `NEXT_PUBLIC_QENCODE_PLAYER_LICENSE` | Qencode dashboard > Player |
| `RESEND_API_KEY` | Resend dashboard > API Keys (required for email links) |

**Environment secrets** (Settings > Environments):

Create two GitHub Environments: `qa` and `production`.
Add a **required reviewer** protection rule on `production`.

| Secret | `qa` | `production` |
|--------|------|-------------|
| `DO_APP_ID` | *(set after step 3)* | *(set after step 3)* |
| `NEXTAUTH_SECRET` | *(generated above)* | *(different value)* |
| `CALLBACK_SIGNING_SECRET` | *(generated above)* | *(different value)* |

### 3. Create DigitalOcean apps

```bash
# Export your secrets so envsubst can substitute them
export NEXTAUTH_SECRET="<qa-value>"
export CALLBACK_SIGNING_SECRET="<qa-value>"
export QENCODE_API_KEY="<your-key>"
export QENCODE_S3_BUCKET="<your-bucket>"
export NEXT_PUBLIC_QENCODE_PLAYER_LICENSE="<your-license>"
export RESEND_API_KEY=""

# Create QA app
envsubst '$NEXTAUTH_SECRET $CALLBACK_SIGNING_SECRET $QENCODE_API_KEY $QENCODE_S3_BUCKET $NEXT_PUBLIC_QENCODE_PLAYER_LICENSE $RESEND_API_KEY' \
  < .do/app.staging.yaml | doctl apps create --spec -

# Note the QA App ID, then update secrets for Production
export NEXTAUTH_SECRET="<prod-value>"
export CALLBACK_SIGNING_SECRET="<prod-value>"

# Create Production app
envsubst '$NEXTAUTH_SECRET $CALLBACK_SIGNING_SECRET $QENCODE_API_KEY $QENCODE_S3_BUCKET $NEXT_PUBLIC_QENCODE_PLAYER_LICENSE $RESEND_API_KEY' \
  < .do/app.yaml | doctl apps create --spec -
```

Record both App IDs and store them in the corresponding GitHub Environment secrets as `DO_APP_ID`.

### 4. Create the `develop` branch

```bash
git checkout main
git checkout -b develop
git push -u origin develop
```

Add branch protection for `develop` (require PRs + CI to pass).

### 5. Configure DNS

**In GoDaddy** (or DigitalOcean DNS if nameservers are delegated):

1. Change nameservers to DigitalOcean:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`

2. **In DigitalOcean** (Networking > Domains):
   - Add domain `awetube.ai`
   - Add subdomain `qa.awetube.ai` pointing to the QA app

SSL/TLS is handled automatically via Let's Encrypt.

DNS propagation takes 15-60 minutes. Monitor with: `dig awetube.ai`

### 6. Verify

```bash
curl https://awetube.ai/api/health
# {"status":"ok","db":"connected","timestamp":"..."}

curl https://qa.awetube.ai/api/health
# {"status":"ok","db":"connected","timestamp":"..."}
```

---

## How Deployments Work

### QA (automatic)
1. Create a feature branch from `develop`
2. Open PR to `develop` > CI runs (secret scan, lint, typecheck, test, build)
3. Merge PR > CD workflow auto-deploys to `qa.awetube.ai`
4. Health check verifies the deployment

### Production (manual)
1. Open PR from `develop` to `main` > CI runs
2. Merge PR > **nothing auto-deploys**
3. Go to Actions > Deploy > Run workflow > select "production"
4. The `production` GitHub Environment requires reviewer approval
5. Deployment proceeds to `awetube.ai`

### What happens during a deploy
1. CD workflow substitutes `${SECRET}` placeholders with GitHub Secrets via `envsubst`
2. `doctl apps update` sends the resolved spec to DigitalOcean
3. App Platform builds the Docker image from `Dockerfile`
4. On startup: `prisma migrate deploy` runs pending migrations
5. `node server.js` starts the Next.js app
6. Health check (`/api/health`) confirms the app is healthy
7. Traffic is routed to the new instance (zero-downtime)

---

## Seed Data (Optional)

```bash
# Via doctl console
doctl apps console <app-id>
npx prisma db seed

# Or from local machine
DATABASE_URL="<connection-string>" npx prisma db seed
```

---

## Troubleshooting

### Build fails
```bash
doctl apps logs <app-id> --type=build
```
Common causes: missing build-time env vars, dependency issues.

### App crashes on startup
```bash
doctl apps logs <app-id> --type=run
```
Common causes: missing runtime env vars (`NEXTAUTH_SECRET`, `DATABASE_URL`).

### Migration fails
```bash
doctl apps logs <app-id> --type=run | grep -i prisma
```
The `run_command` runs `prisma migrate deploy` before starting the server. If it fails, the deployment is rolled back.

### Environment validation fails on startup

`src/lib/env.ts` validates all required environment variables with Zod at startup. If any are missing or malformed, the app fails fast with an error message listing exactly which variables need to be set. Check `doctl apps logs <app-id> --type=run` for the specific validation error.

### Health check fails
```bash
curl -v https://awetube.ai/api/health
```
Ensure `DATABASE_URL` is correctly set and the managed database is accessible.

---

## Cost Breakdown

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| App Platform (Production) | Basic (1 vCPU, 1 GB) | ~$12 |
| App Platform (QA) | Basic (1 vCPU, 0.5 GB) | ~$5 |
| Managed PostgreSQL (Prod) | Basic (1 GB, 1 node) | ~$15 |
| Managed PostgreSQL (QA) | Dev database | ~$7 |
| Qencode Storage | Pay-per-use ($0.006/GB) | ~$1-5 |
| Qencode CDN | Pay-per-use ($0.017/GB) | ~$1-5 |
| Qencode Transcoding | Pay-per-use ($0.005/min) | ~$1-5 |
| Qencode Player | Free | $0 |
| SSL/TLS | Included (Let's Encrypt) | $0 |
| GitHub Actions | Free (public repo) | $0 |
| **Total** | | **~$39-49/mo** |
