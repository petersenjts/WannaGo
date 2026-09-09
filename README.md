# Wannago & Wanna Eats — concierge MVP

A tool for running a manual, boutique travel-and-dining concierge business:
consumers submit a request (a stay or a table), you review it, contact
partners by hand, build a shortlist, and the customer picks one through their
own portal. No matching engine, no *partner*-facing portal, no payments —
just the record-keeping and pipeline you need to run this well, built around
one goal: **tracking customers across both verticals**, since that's what
makes the unit economics work.

## Stack

- **Next.js 16** (App Router, TypeScript) — one codebase for the public
  request forms, the admin dashboard, and the customer portal.
- **PostgreSQL + Prisma 7** (via `@prisma/adapter-pg`) — a real, persistent
  database.
- **Tailwind CSS 4** for styling.
- **Resend** for transactional email (magic-link sign-in, "your options are
  ready" notifications).
- **Auth**: two independent, cookie-based sessions —
  - **Admin**: a single login (email/password in environment variables), no
    roles or multi-user support — deliberate, this is for one operator.
  - **Customer portal**: passwordless magic-link by email, matched against
    the same `Customer` records the admin side already uses.

## Project layout

```
prisma/schema.prisma       — the data model (start here to understand the app)
src/lib/                   — db client, auth (admin + portal), email,
                               customer-matching, formatting
src/actions/                — server actions (the app's "backend" — one file
                               per area: public request submission, admin
                               auth/requests/partners, portal auth/requests)
src/app/                   — pages
  /                        — landing page (choose Wannago or Wanna Eats)
  /stay, /eats             — public request forms
  /admin/login             — admin sign-in
  /admin/requests          — request pipeline (list + detail)
  /admin/customers         — customers, matched across both verticals
  /admin/partners          — lightweight partner CRM
  /portal/login            — customer sign-in (magic link by email)
  /portal                  — customer's requests, plain-language status
  /portal/requests/[id]    — shortlist view + "select this one"
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
- `SESSION_SECRET` — a random string (`openssl rand -base64 32`). Signs both
  the admin session and customer magic links.
- `APP_URL` — `http://localhost:3000` for local dev; your real domain in
  production. Used to build the links inside emails.
- `RESEND_API_KEY` / `EMAIL_FROM` — for sending real email. **You can leave
  these unset locally** — with no API key, magic links are logged to the
  server console instead of emailed, so you can test the whole portal flow
  without a Resend account. To send real email:
  1. Sign up at [resend.com](https://resend.com) (free tier: 3,000
     emails/month).
  2. Add your sending domain and verify it — Resend gives you DNS records to
     add. If your domain is registered through Railway, that's the same
     "Domains" screen where you'd add a record, under the domain's own
     **Add record** action.
  3. Create an API key, set `RESEND_API_KEY` to it and `EMAIL_FROM` to
     something like `"Wannago Concierge <hello@yourdomain.com>"`.

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
   `SESSION_SECRET` (a real random value — don't reuse the local one),
   `APP_URL` (your production domain), and `RESEND_API_KEY`/`EMAIL_FROM`
   once you've verified a sending domain with Resend (see local setup above
   — same steps, just done once and used everywhere).
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
- **Sent to customer** → build the shortlist (hotels) or recommendation
  (dining) under "Shortlist sent to the customer", then click **Mark ready &
  notify customer** — that flips the status and emails the customer a
  sign-in link to view it in their portal.
- **Selected — book it** → the customer picked one in their portal. You'll
  see a purple banner on the request naming their pick — go finalize that
  booking with the partner. If they call to change their mind, use **Clear
  selection** on that banner to reopen the shortlist for them.
- **Booked** / **Closed / lost** → the final state. Log who it was booked
  with and the confirmed price under "Final outcome" — this is what you'll
  total up for monthly partner invoicing (12% hotels, 10% dining, after each
  partner's first 3 months free, shown automatically on the partner page).

Customers never see these internal labels — the portal shows its own
plain-language status (`src/lib/portal-status.ts`) instead.

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
