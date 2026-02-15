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
- **Playlists** — Public, private, and unlisted playlists + Watch Later with drag reordering
- **Tags** — Tag videos for discovery, browse videos by tag
- **Search** — Full-text search across video titles, descriptions, and channel names
- **Trending** — Time-decayed popularity ranking
- **Creator Studio** — Dashboard for managing uploaded videos with stats
- **Password Reset** — Secure token-based password reset via email
- **Error Handling** — Graceful degradation with per-section error states
- **Responsive Design** — Mobile-first layout with collapsible sidebar

### Technical Highlights

- Qencode end-to-end video pipeline (S3 storage, transcoding, CDN delivery, player SDK)
- HMAC-secured transcoding callbacks with timing-safe verification
- Callback replay protection (timestamp-based HMAC, 5-minute window)
- Security headers middleware (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy)
- Zod environment validation (fail-fast at startup with clear error messages)
- Structured JSON logging with Pino
- In-memory rate limiting (6 endpoint-specific limiters)
- Multi-environment deployment (QA + Production)
- CI/CD with GitHub Actions (secret scan, lint, typecheck, test, build, deploy)
- Docker Compose for local development
- 109 tests across 10 test files

## Architecture

```
┌──────────┐                          ┌──────────────────────┐
│  Browser  │ ── TUS Upload ────────→ │  Qencode S3 Storage  │
│          │                          └──────────┬───────────┘
│          │                                     │ transcode
│          │                          ┌──────────▼───────────┐
│          │                          │ Qencode Transcoding   │
│          │                          │ 1080p/720p/480p/360p  │
│          │                          │ + thumbnail            │
│          │                          └──────────┬───────────┘
│          │                                     │ HMAC callback
│          │                          ┌──────────▼───────────┐
│          │ ── API requests ───────→ │  Next.js API Layer    │
│          │                          │  31 routes + middleware│
│          │                          │  (rate limiting, CSP,  │
│          │                          │   HSTS, auth)          │
│          │                          └──────────┬───────────┘
│          │                                     │
│          │                          ┌──────────▼───────────┐
│          │                          │  PostgreSQL (Prisma)  │
│          │                          │  15 models, 3 enums   │
│          │                          └──────────────────────┘
│          │                                     │
│          │   Qencode Player         ┌──────────▼───────────┐
│          │ ←── HLS streaming ────── │    Qencode CDN       │
└──────────┘                          └──────────────────────┘
```

Videos are uploaded via the TUS resumable protocol directly to Qencode S3 storage. Qencode automatically transcodes each upload into four adaptive bitrate streams plus a thumbnail. On completion, a HMAC-signed callback (with timestamp-based replay protection) updates the video record in PostgreSQL with the HLS, DASH, and MP4 URLs. All API responses pass through the security headers middleware. The Qencode Player SDK delivers adaptive streaming to viewers via CDN.

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Session strategy | JWT (not DB sessions) | Stateless, serverless-friendly, no DB lookup per request |
| Rate limiting | In-memory (not Redis) | Zero dependencies for MVP; Redis upgrade path in `rate-limit.ts` |
| Video infrastructure | Qencode (single vendor) | Storage + transcoding + CDN + player — fewer moving parts |
| Pagination | Cursor-based (not offset) | Consistent results on large datasets, efficient with Prisma |
| Components | Server Components default | Less client JS; Client Components only for interactivity |
| Validation | Zod v4 (not v3) | Better error types (`.issues`), `z.ZodType` generics |
| Route params | `Promise<{}>` (Next.js 16) | Breaking change — all params must be `await`ed |
| Callback security | HMAC + timestamp | Prevents replay attacks; 5-minute window |

## Video Processing Lifecycle

```
  ┌────────────┐      ┌─────────────┐      ┌───────┐
  │  UPLOADING │ ───→ │ PROCESSING  │ ───→ │ READY │
  └────────────┘      └──────┬──────┘      └───────┘
                             │
                             └──────────→ ┌────────┐
                                          │ FAILED │
                                          └────────┘
```

| Status | Description |
|--------|-------------|
| **UPLOADING** | TUS resumable upload in progress to Qencode S3 |
| **PROCESSING** | Qencode transcoding job is running (HLS + thumbnail generation) |
| **READY** | Callback received with `status: completed`. HLS/thumbnail URLs stored. Subscribers notified. |
| **FAILED** | Callback received with error, or transcoding timed out. Video marked as failed. |

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

## API Reference

### Auth (4 routes)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | — | NextAuth handler (login, session, OAuth) |
| `/api/auth/register` | POST | — | User registration with email/password |
| `/api/auth/forgot-password` | POST | — | Send password reset email |
| `/api/auth/reset-password` | POST | — | Reset password with token |

### Videos (7 routes)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/videos` | GET | — | List ready videos (cursor-paginated) |
| `/api/videos/[videoId]` | GET, PUT, DELETE | PUT/DELETE: owner | Video details, update, or delete |
| `/api/videos/[videoId]/like` | POST | Required | Toggle like on video |
| `/api/videos/[videoId]/comments` | GET, POST | POST: required | List or create comments |
| `/api/videos/[videoId]/comments/[commentId]` | PATCH, DELETE | Owner | Edit or delete comment |
| `/api/videos/[videoId]/tags` | POST | Owner | Add tag to video (max 10) |
| `/api/videos/[videoId]/tags/[tagId]` | DELETE | Owner | Remove tag from video |

### Tags (2 routes)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/tags` | GET | — | Search/list tags with video counts |
| `/api/tags/[tagName]/videos` | GET | — | Browse ready videos by tag |

### Channels (1 route)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/channels/[channelId]` | GET, PUT | PUT: owner | Channel details or update profile |

### Subscriptions (2 routes)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/subscriptions/[channelId]` | GET, POST | POST: required | Check or toggle subscription |
| `/api/subscriptions/feed` | GET | Required | Videos from subscribed channels |

### Playlists (5 routes)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/playlists` | GET, POST | Required | List or create playlists |
| `/api/playlists/[playlistId]` | GET, PUT, DELETE | Owner | Playlist details, update, or delete |
| `/api/playlists/[playlistId]/items` | POST, DELETE | Owner | Add/remove video from playlist |
| `/api/playlists/[playlistId]/items/reorder` | PATCH | Owner | Reorder playlist items |
| `/api/playlists/watch-later` | GET, POST | Required | Watch Later playlist |

### Notifications (3 routes)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/notifications` | GET, PATCH | Required | List notifications or mark all read |
| `/api/notifications/[notificationId]` | PATCH | Owner | Mark single notification read |
| `/api/notifications/unread-count` | GET | Required | Unread notification count |

### History (1 route)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/history` | POST, DELETE | Required | Record watch progress or clear history |

### Upload (4 routes)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/upload/initiate` | POST | Required | Create Qencode task + TUS upload URI |
| `/api/upload/start-transcode` | POST | Required | Start transcoding after upload completes |
| `/api/upload/callback` | POST | HMAC | Qencode webhook (HMAC-signed) |
| `/api/upload/status/[taskToken]` | GET | Required | Check transcoding status |

### Search (1 route)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/search` | GET | — | Full-text search across videos and channels |

### Health (1 route)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/health` | GET | — | Health check (DB connectivity) |

## Database Schema

```
User ─1:1─ Channel ─1:N─ Video ─1:N─ Comment
                              ├─ N:M ─ Tag (via VideoTag)
                              ├─ 1:N ─ Like
                              └─ 1:N ─ PlaylistItem ─ N:1 ─ Playlist
User ─1:N─ Subscription ─ N:1 ─ Channel
User ─1:N─ Notification
User ─1:N─ WatchHistory ─ N:1 ─ Video
```

15 models, 3 enums (`VideoStatus`, `NotificationType`, `PlaylistVisibility`). All foreign keys cascade-delete from parent. See `prisma/schema.prisma` for full schema with doc comments.

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
│   ├── schema.prisma             # 15 models, 3 enums
│   └── seed.ts                   # Demo data seeder
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               #   Login, register, password reset
│   │   ├── api/                  #   31 API routes (see API Reference)
│   │   │   ├── health/           #   Health check endpoint
│   │   │   ├── upload/           #   TUS upload + Qencode integration
│   │   │   ├── videos/           #   Video CRUD + comments + likes + tags
│   │   │   ├── tags/             #   Tag search + browse by tag
│   │   │   ├── playlists/        #   Playlist CRUD + reorder
│   │   │   └── ...               #   Auth, channels, notifications, etc.
│   │   ├── studio/               #   Creator studio
│   │   ├── watch/                #   Video player page
│   │   └── ...                   #   Search, history, library, etc.
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components + ErrorState
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
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── env.ts                # Zod environment validation
│   │   ├── notifications.ts      # Notification dispatch helpers
│   │   └── channel-utils.ts      # Channel handle generation
│   ├── middleware.ts              # Security headers (CSP, HSTS, etc.)
│   ├── types/                    # TypeScript type definitions
│   │   └── next-auth.d.ts        #   NextAuth JWT/session augmentation
│   └── __tests__/                # 10 test files, 109 tests
│       ├── setup.ts              #   Global mocks (Prisma, auth, Qencode)
│       ├── api/                  #   API route tests
│       └── lib/                  #   Library module tests
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yml            # PostgreSQL + migrations + app
├── Makefile                      # Developer commands
├── DEPLOYMENT.md                 # Detailed deployment guide
├── CONTRIBUTING.md               # Development workflow + testing guide
└── SECURITY.md                   # Vulnerability reporting + security measures
```

## Scripts

| npm command | make equivalent | Description |
|-------------|-----------------|-------------|
| `npm run dev` | `make dev` | Start development server |
| `npm run build` | `make build` | Build for production |
| `npm start` | — | Start production server |
| `npm test` | `make test` | Run 109 tests |
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

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, testing guide, and commit conventions.

## Security

To report a vulnerability, please see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
