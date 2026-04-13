# OpenClaw Backend

## Run
1. Copy root `.env.example` to `.env` in project root.
2. Start infra with Docker:
   - `docker compose up -d`
3. Install deps from monorepo root:
   - `npm install`
4. Start backend:
   - `npm run dev:backend:new`

## Health
- `GET /api/health`

This backend is the initial composition root for modular multi-tenant domains.