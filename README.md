## CCSA Mobile — Web Admin Dashboard & API (Next.js + Prisma)

Overview

This directory contains the web admin dashboard and API used to manage data for the CCSA mobile application. It's built primarily with Next.js (server-side rendering + API routes), Prisma as the ORM for the database, and integrates multiple third-party services for auth, notifications, maps, SMS, and PDF/QR generation.

High-level features

- Admin dashboard with pages for:
  - Dashboard and analytics (charts, KPIs)
  - Farmers, Farms and clusters management
  - Agents and user management
  - Certificates generation and verification (QR codes)
  - GIS mapping pages (Google Maps / Leaflet views)
  - Settings, profile and access control
- REST/Graph-like API endpoints (Next.js API routes) used by the mobile app and admin UI
- Authentication support (NextAuth or API-based auth for admin users)
- PDF and QR code generation for certificates
- Integrations: Supabase, Firebase Admin, email (nodemailer), SMS gateways (Twilio, AfricasTalking), termii service, and other third-party APIs

Repository structure (important folders)

- `pages/` — Next.js pages including admin UI and API routes
- `lib/` — server-side libraries and helpers (auth, database manager, mailers, utilities)
- `prisma/` — Prisma schema, migrations and seeds
- `components/` — React components used by the admin UI
- `public/` — static assets
- `scripts/` — helper scripts (db scripts, validation scripts)

Key technologies

- Next.js (latest stable) for frontend and API routes
- Prisma (with `@prisma/client`) for database modeling and migrations
- React + charting libs (chart.js, recharts) for analytics visuals
- react-leaflet / @react-google-maps/api for mapping features
- next-auth or JWT-based auth for admin users

Important scripts (from package.json)

- `npm run dev` — run Next.js in dev mode on 0.0.0.0:3000
- `npm run build` — `prisma generate && next build`
- `npm run build:with-db` — generate prisma artifacts, push DB schema, and build
- `npm run start` — start Next.js in production mode
- `npm run db:generate` — `prisma generate`
- `npm run db:push` — `prisma db push`
- `npm run db:migrate` — `prisma migrate deploy`
- `npm run db:studio` — open Prisma Studio
- `npm run lint` / `npm run lint:fix` — linting helpers
- `npm run validate:production` — project-specific production validation script
- `npm run health:check` — basic curl health check for local testing

Environment variables

This project integrates many external services. Typical environment variables you must set before running locally or deploying:

- DATABASE_URL — connection string for the primary database (Postgres, etc.)
- NEXTAUTH_SECRET / NEXTAUTH_URL — if using NextAuth
- SUPABASE_URL and SUPABASE_SERVICE_KEY / SUPABASE_ANON_KEY — if interacting with Supabase
- FIREBASE credentials (service account) for server-side Firebase Admin usage
- JWT_SECRET — for token signing (if used)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — for sending emails
- AFRICASTALKING_USERNAME / AFRICASTALKING_API_KEY — for SMS (if used)
- TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM — for Twilio SMS
- OTHER_3RD_PARTY_KEYS — mapping API keys, analytics keys, and any 3rd party service keys

Check `lib/` and `pages/api` for the exact variable names referenced in your codebase.

Database and Prisma

This app uses Prisma for schema and migrations. Common commands:

```bash
# generate client
npm run db:generate

# push schema (non-destructive)
npm run db:push

# run migrations / deploy
npm run db:migrate

# open Prisma Studio
npm run db:studio
```

Running locally (development)

```bash
# install dependencies
npm install

# start dev server
npm run dev

# open http://localhost:3000
```

Health checks and quick API tests

- `npm run health:check` — a quick curl check to verify the app responds on port 3000
- `npm run test:api` — another curl-based quick validation endpoint

Deployment notes

- A `vercel-build` script exists for Vercel deployments which runs `prisma generate`, `prisma db push`, and `next build`.
- For production deployments, ensure the database migrations or `db push` have been executed and that environment variables are correctly set on the host (Vercel, Docker, Kubernetes, etc.).
- The `validate:production` script performs additional runtime checks before marking a deployment as healthy.

Security and operational notes

- Protect secrets: keep service account JSONs and private keys outside of the repo and use secure stores or platform secrets.
- Review `prisma/schema.prisma` to understand database models and relations before applying destructive schema changes.
- Add robust monitoring and alerting for background jobs and SMS/email delivery subsystems.

Troubleshooting

- `prisma generate` or `prisma db push` errors: verify `DATABASE_URL` and Prisma binary support for your OS/arch.
- Next.js build errors: run `npm run build` locally and inspect stack traces; ensure `NODE_ENV` and other production values are correct.
- API errors: review server logs and use the `health:check` and `test:api` endpoints to narrow down routing/service problems.

Contributing

- Follow existing code patterns for pages/components.
- Add or update Prisma migrations via `prisma migrate` when changing schema.
- Add unit/integration tests for critical backend flows where possible.

--
README generated to document the admin/API server features and run instructions.
