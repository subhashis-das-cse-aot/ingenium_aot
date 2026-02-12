## Ingenium CMS Setup

### 1. Environment variables

Create/update `.env.local`:

```bash
POSTGRES_URL=postgres://postgres:tiger@localhost:5432/ingenium
DATABASE_URL=${POSTGRES_URL}
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are used once to bootstrap the first admin user automatically.

### 2. PostgreSQL schema

Run `sql/cms_schema.sql` on your database:

```bash
psql "$DATABASE_URL" -f sql/cms_schema.sql
```

The app also has a runtime schema guard (`ensureCmsSchema`) so local dev can self-heal missing tables.

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Admin workflow

- Login: `/admin/login`
- CMS dashboard: `/admin`
- Manage articles by `year + section`
- Set any year as current from admin
- Archive action:
  - Archives current year
  - Creates next year as current

### 5. Public routes

- `/` renders the current year using the existing homepage UI.
- `/year/[year]` renders archived year data using the exact same homepage UI.

### 6. Vercel deployment

- If using Vercel Postgres, you can rely on `POSTGRES_URL` directly.
- `DATABASE_URL` remains supported; set `DATABASE_URL=${POSTGRES_URL}` for compatibility with local tooling.
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Vercel environment variables.
