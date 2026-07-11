# MyGuruva Public API

Read-only Express + Prisma middleware for the public college site. Talks to the same Azure Postgres as the CRM. No auth; listing gates are enforced in SQL.

## Local

```bash
cp .env.example .env   # set DATABASE_URL (same as CRM)
npm install
npm run db:generate
npm run dev            # http://localhost:4100
```

Smoke: `curl http://localhost:4100/v1/health`

## Endpoints

- `GET /v1/health`
- `GET /v1/institutions`
- `GET /v1/institutions/:slug`
- `GET /v1/compare?slugs=`
- `GET /v1/suggest?q=`
- `GET /v1/taxonomies/{streams,courses,locations,exams,ranking-bodies}`
- `GET /v1/sitemap/institutions`

Search `q` uses Postgres full-text (`simple` config) with `ILIKE` fallback — no CRM schema changes required.
