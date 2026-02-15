# Contributing to AweTube

Thank you for your interest in contributing to AweTube! This guide will help you get started.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies:** `npm install`
3. **Copy environment variables:** `cp .env.example .env` and fill in values
4. **Set up the database:** `npx prisma migrate dev`
5. **Start the dev server:** `npm run dev`

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Make your changes
3. Verify your changes pass all checks:
   ```bash
   npm test              # Run tests
   npm run lint          # Run linter
   npx tsc --noEmit      # Type check
   ```
4. Commit your changes using [conventional commits](#commit-convention)
5. Push to your fork and open a Pull Request

## Code Style

- **TypeScript** — Strict mode is enabled. All code must be type-safe.
- **ESLint** — Next.js ESLint configuration. Run `npm run lint` to check.
- **Tailwind CSS** — Used for all styling. Follow existing component patterns.
- **Zod v4** — Used for all input validation. Schemas live in `src/lib/validation.ts`. Note: Zod v4 uses `.issues` (not `.errors`).
- **API Routes** — Use `parseBody`/`parseSearchParams` from `src/lib/api-utils.ts` for request validation.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `test:` | Adding or updating tests |
| `refactor:` | Code refactoring (no feature change) |
| `chore:` | Maintenance, dependency updates |
| `style:` | Code style changes (formatting, no logic change) |

**Examples:**
```
feat: add video thumbnail preview on hover
fix: resolve race condition in like toggle
docs: update README with Docker instructions
test: add tests for playlist API routes
```

## Pull Request Process

1. Ensure CI passes (lint, type check, tests, build)
2. Fill in the PR template with a description of your changes
3. Update documentation if you're adding new features or changing behavior
4. Add tests for new functionality
5. One approval is required before merging

## Reporting Bugs

Use [GitHub Issues](../../issues) to report bugs. Please include:

- A clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Browser/OS information if relevant
- Screenshots or error logs if available

## Requesting Features

Use [GitHub Issues](../../issues) to request features. Please include:

- A clear description of the feature
- The problem it solves or the use case
- Any ideas for implementation (optional)

## Questions?

If you have questions about contributing, feel free to open a [Discussion](../../discussions).
