# Wannago & Wanna Eats — concierge MVP

A tool for running a manual, boutique travel-and-dining concierge business:
consumers submit a request (a stay or a table), you review it, contact
partners by hand, and log the outcome. No matching engine, no partner portal,
no payments — just the record-keeping and pipeline you need to run this well,
built around one goal: **tracking customers across both verticals**, since
that's what makes the unit economics work.

## Stack

- **Next.js 16** (App Router, TypeScript) — one codebase for the public
  request forms and the admin dashboard.
- **PostgreSQL + Prisma 7** (via `@prisma/adapter-pg`) — a real, persistent
  database.
- **Tailwind CSS 4** for styling.
- **Auth**: a single admin login (email/password in environment variables),
  no roles or multi-user support — that's deliberate, this is for one
  operator.

## Project layout

```
prisma/schema.prisma       — the data model (start here to understand the app)
src/lib/                   — db client, auth, customer-matching, formatting
src/actions/                — server actions (the app's "backend" — one file
                               per area: public request submission, admin
                               auth, admin requests, admin partners)
src/app/                   — pages
  /                        — landing page (choose Wannago or Wanna Eats)
  /stay, /eats             — public request forms
  /admin/login             — admin sign-in
  /admin/requests          — request pipeline (list + detail)
  /admin/customers         — customers, matched across both verticals
  /admin/partners          — lightweight partner CRM
```

Everything reads from and writes to the single `Request` table (with
`StayDetails`/`DiningDetails` for the vertical-specific fields) and a shared
`Customer` table. A request is matched to a customer by normalized email or
phone at submission time — see `src/lib/customers.ts`. That's the whole
mechanism behind cross-vertical tracking.

## Local setup

### 1. Get a Postgres database

Any standard Postgres works. The free tiers on
[Neon](https://neon.tech), [Railway](https://railway.app), or
[Supabase](https://supabase.com) are all fine for development — Neon is the
quickest to spin up (a couple of clicks, no credit card). Copy the connection
string it gives you.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — the Postgres connection string from step 1.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — whatever you want to log into `/admin`
  with.
- `SESSION_SECRET` — a random string (`openssl rand -base64 32`).

### 3. Install and set up the database

```bash
npm install
npx prisma migrate dev --name init
```

`migrate dev` creates the tables from `prisma/schema.prisma`. Run it again
(with a new `--name`) any time you change the schema.

### 4. Run it

```bash
npm run dev
```

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin (redirects to login)

Useful extras:

```bash
npm run db:studio   # Prisma Studio — a GUI to browse/edit the database directly
```

## Deploying

The app is set up to deploy as a single Docker container — this works on
[Railway](https://railway.app), [Render](https://render.com),
[Fly.io](https://fly.io), or any host that runs a Dockerfile. Railway is the
easiest: it can host the app *and* the Postgres database in the same
project.

### Railway (recommended)

1. Push this repo to GitHub.
2. In Railway, **New Project → Deploy from GitHub repo**, pick this repo. It
   will detect the `Dockerfile` and build it automatically.
3. **New → Database → PostgreSQL** in the same project. Railway gives it a
   `DATABASE_URL` — reference it in your app service's variables as
   `${{Postgres.DATABASE_URL}}` (Railway's variable-reference syntax), so it
   stays in sync if the database ever moves.
4. In the app service's **Variables**, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   and `SESSION_SECRET` (a real random value — don't reuse the local one).
5. Deploy. Then run the migration **once** against the production database —
   easiest from your machine with the Railway CLI:
   ```bash
   railway link      # pick this project
   railway run npx prisma migrate deploy
   ```
   Run this again after any future schema change, before or right after
   deploying it.
6. Railway gives you a public URL. Add a custom domain under the service's
   **Settings** if you want one.

### Any other Docker host

```bash
docker build -t wannago .
docker run -p 3000:3000 --env-file .env wannago
```

Same idea elsewhere: provision Postgres, set the four environment variables,
deploy the Dockerfile, then run `npx prisma migrate deploy` once against that
database from a machine that has the CLI and the production `DATABASE_URL`
(the container image itself doesn't include the Prisma CLI, by design — it's
a build/ops tool, not something the running app needs).

## How the pipeline maps to how you work

- **New** → a request just came in.
- **In progress** → you're contacting partners (log each one under "Partners
  contacted" on the request page — this is your own record, not synced from
  anywhere).
- **Sent to customer** → you've sent your shortlist (hotels) or
  recommendation (dining) — log what you sent under "Shortlist sent to the
  customer".
- **Booked** / **Closed / lost** → the final state. Log who it was booked
  with and the confirmed price under "Final outcome" — this is what you'll
  total up for monthly partner invoicing (12% hotels, 10% dining, after each
  partner's first 3 months free, shown automatically on the partner page).

The **Customers** tab and the "hasn't tried the other side" filter on
**Requests** are there specifically to surface who's only used one vertical —
worth a manual nudge, per the business model.

## Extending this later

- Schema changes: edit `prisma/schema.prisma`, then
  `npx prisma migrate dev --name <description>`.
- New admin actions live in `src/actions/` as plain async functions with a
  `"use server"` directive — no framework beyond that.
- Everything reads request data through `src/lib/db.ts`'s `db` export
  (a Prisma Client instance) — no separate API layer to keep in sync.
