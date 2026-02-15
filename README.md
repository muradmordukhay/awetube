# AweTube

A modern, open-source video sharing platform built with Next.js 16, React 19, and TypeScript.

## Features

- **Video Upload & Streaming** — Upload videos with automatic HLS adaptive transcoding (1080p, 720p, 480p, 360p)
- **Custom Video Player** — Keyboard shortcuts, quality selector, picture-in-picture, playback speed control, progress scrubbing
- **Authentication** — Email/password registration + Google and GitHub OAuth
- **Channels** — Each user gets a channel with customizable name, handle, avatar, and banner
- **Subscriptions & Feed** — Subscribe to channels, get a personalized feed of new uploads
- **Notifications** — Real-time notification bell for new videos from subscriptions and comment replies
- **Comments** — Threaded replies, edit/delete, comment moderation by video owners
- **Likes** — Like videos with optimistic UI updates
- **Watch History** — Automatic progress tracking with playback resume
- **Playlists** — Create, manage, and share playlists with public/private/unlisted visibility
- **Watch Later** — Quick-save videos for later viewing
- **Search** — Full-text search across video titles, descriptions, and channel names
- **Trending** — Time-decayed popularity ranking
- **Creator Studio** — Dashboard for managing uploaded videos with stats
- **Password Reset** — Secure token-based password reset via email
- **Responsive Design** — Mobile-first layout with collapsible sidebar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Database | [PostgreSQL](https://www.postgresql.org/) via [Prisma 6](https://www.prisma.io/) |
| Auth | [NextAuth v5](https://authjs.dev/) (JWT strategy) |
| Validation | [Zod 4](https://zod.dev/) |
| Video Transcoding | [Qencode](https://www.qencode.com/) |
| Video Playback | [HLS.js](https://github.com/video-dev/hls.js/) |
| Email | [Resend](https://resend.com/) |
| Testing | [Vitest](https://vitest.dev/) |
| CI/CD | [GitHub Actions](https://github.com/features/actions) |
| Containerization | [Docker](https://www.docker.com/) (multi-stage build) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [PostgreSQL](https://www.postgresql.org/) 16+
- [Qencode](https://www.qencode.com/) account (for video transcoding)
- [Resend](https://resend.com/) account (optional, for password reset emails)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/awetube.git
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

   Edit `.env` and fill in your database URL, secrets, and API keys. See `.env.example` for all available options.

4. **Set up the database**

   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker

```bash
docker build -t awetube .
docker run -p 3000:3000 --env-file .env awetube
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── (auth)/             # Auth pages (login, register, password reset)
│   ├── api/                # API routes
│   ├── channel/            # Channel page
│   ├── studio/             # Creator studio
│   ├── upload/             # Video upload page
│   ├── watch/              # Video watch page
│   └── ...                 # Other pages (search, history, library, etc.)
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── video/              # Video player, controls, details
│   └── ...                 # Other components
├── lib/                    # Utilities and configuration
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client
│   ├── validation.ts       # Zod schemas
│   ├── rate-limit.ts       # Rate limiting
│   └── qencode/            # Qencode integration
├── types/                  # Shared TypeScript types
└── __tests__/              # Test suite
prisma/
└── schema.prisma           # Database schema
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint code with ESLint |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

To report a vulnerability, please see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
