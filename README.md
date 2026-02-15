# AweTube

[![CI](https://github.com/muradmordukhay/awetube/actions/workflows/ci.yml/badge.svg)](https://github.com/muradmordukhay/awetube/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)

A modern, open-source video sharing platform built with Next.js 16, React 19, and Qencode for video infrastructure.

## Features

- **Video Upload & Streaming** — Resumable TUS uploads with automatic Qencode transcoding (1080p, 720p, 480p, 360p)
- **Qencode Player** — Adaptive HLS streaming, quality selector, picture-in-picture, playback speed control
- **Authentication** — Email/password registration + Google and GitHub OAuth
- **Channels** — Customizable profiles with name, handle, avatar, and banner
- **Subscriptions & Feed** — Subscribe to channels, get a personalized feed of new uploads
- **Notifications** — Real-time bell for new videos from subscriptions and comment replies
- **Comments** — Threaded replies, edit/delete, moderation by video owners
- **Likes** — Like videos with optimistic UI updates
- **Watch History** — Automatic progress tracking with playback resume
- **Playlists** — Public, private, and unlisted playlists + Watch Later
- **Search** — Full-text search across video titles, descriptions, and channel names
- **Trending** — Time-decayed popularity ranking
- **Creator Studio** — Dashboard for managing uploaded videos with stats
- **Password Reset** — Secure token-based password reset via email
- **Responsive Design** — Mobile-first layout with collapsible sidebar

### Technical Highlights

- Qencode end-to-end video pipeline (S3 storage, transcoding, CDN delivery, player SDK)
- HMAC-secured transcoding callbacks with timing-safe verification
- Structured JSON logging with Pino
- In-memory rate limiting (6 endpoint-specific limiters)
- Multi-environment deployment (QA + Production)
- CI/CD with GitHub Actions (secret scan, lint, typecheck, test, build, deploy)
- Docker Compose for local development
- 69 tests across 7 test files

## Architecture

```
┌─────────┐    TUS Upload     ┌──────────────────────┐
│ Browser  │ ────────────────→ │  Qencode S3 Storage  │
└─────────┘                    └──────────┬───────────┘
                                          │
                               ┌──────────▼───────────┐
                               │ Qencode Transcoding   │
                               │ 1080p/720p/480p/360p  │
                               │ + thumbnail            │
                               └──────────┬───────────┘
                                          │
                               ┌──────────▼───────────┐
                               │  HMAC Callback → API  │
                               │  → PostgreSQL          │
                               └──────────┬───────────┘
                                          │
┌─────────┐   Qencode Player  ┌──────────▼───────────┐
│ Browser  │ ←──────────────── │    Qencode CDN       │
└─────────┘                    └──────────────────────┘
```

Videos are uploaded via the TUS resumable protocol directly to Qencode S3 storage. Qencode automatically transcodes each upload into four adaptive bitrate streams plus a thumbnail. On completion, a HMAC-signed callback updates the video record in PostgreSQL with the HLS, DASH, and MP4 URLs. The Qencode Player SDK delivers adaptive streaming to viewers via CDN.

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) | Server components, API routes, standalone output |
| UI | [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) | Type-safe UI development |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Utility-first styling + component library |
| Database | [PostgreSQL 16](https://www.postgresql.org/) + [Prisma 6](https://www.prisma.io/) | Relational DB with type-safe ORM |
| Auth | [NextAuth v5](https://authjs.dev/) (JWT) | Email/password + OAuth (Google, GitHub) |
| Video | [Qencode](https://www.qencode.com/) | TUS upload, transcoding, S3 storage, CDN, HLS player |
| Validation | [Zod 4](https://zod.dev/) | Runtime schema validation |
| Data Fetching | [TanStack Query 5](https://tanstack.com/query) | Client-side data fetching + caching |
| Email | [Resend](https://resend.com/) | Transactional emails (password reset) |
| Logging | [Pino](https://getpino.io/) | Structured JSON logging (pretty in dev) |
| Testing | [Vitest 4](https://vitest.dev/) | Unit and API testing |
| CI/CD | [GitHub Actions](https://github.com/features/actions) | Automated testing + deployment |
| Hosting | [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) | Docker-based hosting with managed PostgreSQL |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [PostgreSQL](https://www.postgresql.org/) 16+ (or [Docker](https://www.docker.com/))
- [Qencode](https://www.qencode.com/) account (API key, S3 bucket, player license)
- [Resend](https://resend.com/) account (optional, for password reset emails)

### Quick Start (Docker)

```bash
git clone https://github.com/muradmordukhay/awetube.git
cd awetube
cp .env.example .env
# Edit .env with your database URL and Qencode credentials

make up          # Start PostgreSQL, run migrations, launch dev server
make seed        # Load demo data (4 users, videos, comments, playlists)
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Manual Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/muradmordukhay/awetube.git
   cd awetube
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your database URL, secrets, and Qencode credentials. See `.env.example` for all available options.

4. **Set up the database**

   ```bash
   npx prisma migrate deploy
   npx prisma db seed          # Optional: load demo data
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make up` | Start PostgreSQL + migrations + dev server |
| `make down` | Stop Docker services |
| `make seed` | Seed database with demo data |
| `make migrate` | Create a new migration (interactive) |
| `make studio` | Open Prisma Studio |
| `make test` | Run test suite |
| `make lint` | Run ESLint |
| `make build` | Production build |
| `make docker-up` | Full Docker stack (db + app) |

## Project Structure

```
awetube/
├── .do/                          # DigitalOcean App Platform specs
│   ├── app.yaml                  #   Production (awetube.ai)
│   └── app.staging.yaml          #   QA (qa.awetube.ai)
├── .github/workflows/
│   ├── ci.yml                    # CI: secret scan, lint, test, build
│   └── deploy.yml                # CD: deploy to QA or Production
├── prisma/
│   ├── migrations/               # Database migrations
│   ├── schema.prisma             # 13 models, 3 enums
│   └── seed.ts                   # Demo data seeder
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               #   Login, register, password reset
│   │   ├── api/                  #   30+ API routes
│   │   │   ├── health/           #   Health check endpoint
│   │   │   ├── upload/           #   TUS upload + Qencode integration
│   │   │   ├── videos/           #   Video CRUD + comments + likes
│   │   │   └── ...               #   Auth, channels, playlists, etc.
│   │   ├── studio/               #   Creator studio
│   │   ├── watch/                #   Video player page
│   │   └── ...                   #   Search, history, library, etc.
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── video/                # Qencode Player, VideoCard, VideoGrid
│   │   └── ...                   # Layout, comments, playlists, etc.
│   ├── lib/
│   │   ├── qencode/              # Qencode integration
│   │   │   ├── client.ts         #   API client (auth, tasks, status)
│   │   │   ├── transcoding.ts    #   Job configuration (4 qualities)
│   │   │   └── cdn.ts            #   S3 → CDN URL transformation
│   │   ├── validation.ts         # Centralized Zod schemas
│   │   ├── api-utils.ts          # parseBody / parseSearchParams
│   │   ├── rate-limit.ts         # In-memory rate limiting
│   │   ├── callback-signature.ts # HMAC signing & verification
│   │   ├── logger.ts             # Pino structured logging
│   │   ├── auth.ts               # NextAuth configuration
│   │   └── db.ts                 # Prisma client singleton
│   ├── types/                    # TypeScript type definitions
│   └── __tests__/                # 7 test files, 69 tests
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yml            # PostgreSQL + migrations + app
├── Makefile                      # Developer commands
├── DEPLOYMENT.md                 # Detailed deployment guide
├── CONTRIBUTING.md               # Development workflow
└── SECURITY.md                   # Vulnerability reporting
```

## Scripts

| npm command | make equivalent | Description |
|-------------|-----------------|-------------|
| `npm run dev` | `make dev` | Start development server |
| `npm run build` | `make build` | Build for production |
| `npm start` | — | Start production server |
| `npm test` | `make test` | Run tests |
| `npm run test:watch` | — | Run tests in watch mode |
| `npm run test:coverage` | — | Run tests with coverage |
| `npm run lint` | `make lint` | Lint code with ESLint |

## Deployment

AweTube runs on **DigitalOcean App Platform** with managed PostgreSQL and Qencode for video infrastructure.

```
feature/xyz ──PR──→ develop ──auto-deploy──→ qa.awetube.ai
                       │
                      PR
                       │
                      main ──manual-trigger──→ awetube.ai
```

- **QA** — Auto-deploys when code is merged to `develop`
- **Production** — Manual trigger from GitHub Actions with reviewer approval
- **Cost** — ~$39-49/month (App Platform + PostgreSQL + Qencode usage)

For setup instructions, environment configuration, DNS, and troubleshooting, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and commit conventions.

## Security

To report a vulnerability, please see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
