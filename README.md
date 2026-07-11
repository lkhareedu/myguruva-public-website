# MyGuruva Public Website

Next.js App Router public college discovery site + local Express middleware (`api/`).

## Develop (local, real Azure Postgres)

1. Allow your IP on the Azure Postgres firewall (same as CRM local).
2. Put `DATABASE_URL` in `api/.env` (see `api/.env.example`).
3. Run both processes:

```bash
# Terminal A — middleware :4100
cd api && npm install && npm run db:generate && npm run dev

# Terminal B — Next :3000
cd .. && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Browser `/v1/*` rewrites to the middleware (`PUBLIC_API_BASE_URL` in `.env.local`).

Smoke: `curl http://localhost:4100/v1/health` and `curl 'http://localhost:4100/v1/institutions?pageSize=3'`.

## API

See [`api/README.md`](./api/README.md). Endpoints: health, institutions, compare, suggest, taxonomies, sitemap.

Search uses Postgres full-text (`simple` config) + `ILIKE` — no CRM schema changes.

Later: deploy `api/` to Azure App Service; set Vercel `PUBLIC_API_BASE_URL` to that host.
