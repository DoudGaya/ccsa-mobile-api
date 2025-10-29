# Contributing to CCSA Mobile — Admin & API

Welcome! This guide helps new contributors and maintainers work with the admin dashboard and API. It covers issue creation, branching, pull requests, Prisma/database changes, testing, code review, and deployment notes.

Table of contents

- Before you begin
- Reporting issues and feature requests
- Branching and commit guidelines
- Local development (services, database, env)
- Prisma and database migrations
- Running the app locally
- PR checklist and code review
- Schema and migration review guidance
- CI, builds and deployment

Before you begin

- Fork and clone the repository. Keep your fork up to date with the upstream `main` branch.

  ```bash
  git clone git@github.com:<your-username>/ccsa-mobile-api.git
  git remote add upstream git@github.com:DoudGaya/ccsa-mobile-api.git
  git fetch upstream
  git merge upstream/main
  ```

Reporting issues and feature requests

- Provide a clear, actionable title and a reproducible set of steps.
- Include environment info: Node version, OS, browser, API version, and relevant logs.
- For UI issues, include screenshots and steps to reproduce.

Branching and commit guidelines

- Branch naming examples:
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `chore/<short-description>`

- Keep branches small and focused.
- Commit message pattern (recommended):

  ```text
  feat(api): add farmer import endpoint
  fix(prisma): correct relation between farmer and cluster
  ```

Local development (services, database, env)

Prerequisites

- Node.js (LTS)
- A local Postgres database (or another provider matching `DATABASE_URL`)
- Yarn or npm

Environment variables

Create a `.env.local` or `.env` file in the project root with keys such as:

```text
DATABASE_URL=postgresql://user:pass@localhost:5432/ccsa_dev
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-secret
# Supabase, Firebase, Twilio, SMTP, and other keys as required
```

Check `lib/` and `pages/api` for exact variable names used in this codebase and add them to `.env.local`.

Prisma and database migrations

- Generate Prisma client after any schema change:

  ```bash
  npm run db:generate
  ```

- Create migrations (when making schema changes that should be preserved):

  ```bash
  npx prisma migrate dev --name describe-change
  ```

- For CI and production deploys use `prisma migrate deploy` or `npm run db:migrate` depending on your workflow.
- Use `npm run db:push` only for quick, non-destructive schema syncs (not recommended for production migrations).

Running the app locally

Install dependencies:

```bash
npm install
# or
yarn install
```

Start development server:

```bash
npm run dev
# opens Next.js dev server at http://localhost:3000
```

Useful commands

- `npm run db:studio` — open Prisma Studio (`http://localhost:5555` by default)
- `npm run build` — build the app (runs `prisma generate` first)
- `npm run lint` — lint the codebase
- `npm run type-check` — run TypeScript checks

PR checklist and code review

Before opening a PR, ensure:

- The change builds locally (`npm run build`) and runs without errors.
- Type checks pass: `npm run type-check`.
- Linter passes: `npm run lint` (or `npm run lint:fix` to auto-fix where possible).
- Tests (if present) pass and database migrations are included when schema changes are made.
- The PR description explains the why, lists steps to test, and links any related issues.

Code review focuses

- API surface: Are request/response contracts well defined and validated?
- Security: Are inputs validated and sensitive data protected?
- DB changes: Does the migration preserve data? Are indexes added when needed?
- Performance: Are heavy operations batched and paginated?
- UX: For UI changes ensure responsiveness and accessible labeling.

Schema and migration review guidance

- Prefer additive migrations (adding columns/tables) over destructive operations.
- When dropping or renaming columns, provide a migration plan and run it in a staging environment first.
- Keep migration names descriptive and run `prisma generate` after migrations.

CI, builds and deployment

- The repository includes scripts for `vercel-build` and `build:with-db` which include `prisma generate` and `prisma db push` where appropriate.
- On production, prefer `prisma migrate deploy` instead of `db push` and ensure environment variables are set securely.
- Run `npm run validate:production` as part of the deployment pipeline to catch missing env vars or config issues.

Getting help

- If you need context about why something was implemented, check commit history, or ask maintainers in the issue or PR comments.
- For urgent production issues, tag maintainers and provide logs, timestamps, and steps to reproduce.

Thanks for contributing — we appreciate clear, well-tested changes and thoughtful reviews.
