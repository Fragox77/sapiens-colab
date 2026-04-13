# SAPIENS COLAB — Monorepo

Plataforma integrada de la agencia creativa SAPIENS COLAB.

```
sapiens-colab/
├── web/    → Next.js 15 + TypeScript + Tailwind (frontend)
└── api/    → Express + MongoDB (backend)
```

## Arranque rápido

### 1. Instalar dependencias
```bash
# Desde la raíz del monorepo
npm run install:all
```

### 2. Variables de entorno
```bash
# Backend
cp api/.env.example api/.env
# → Edita api/.env con tus credenciales MongoDB, JWT, Cloudinary

# Frontend
cp web/.env.local.example web/.env.local
# → El valor por defecto apunta a localhost:4000
```

### 3. Correr en desarrollo
```bash
# Ambos a la vez (requiere concurrently)
npm run dev

# O por separado:
npm run dev:api   # → http://localhost:4000
npm run dev:web   # → http://localhost:3000
```

## URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| API (Express) | http://localhost:4000 |
| Health check | http://localhost:4000/api/health |

## Estructura de la API

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | /api/auth/registro | Crear cuenta cliente | Público |
| POST | /api/auth/login | Login | Público |
| GET | /api/auth/me | Usuario autenticado | Auth |
| GET | /api/services | Lista de servicios + precios | Público |
| POST | /api/services/quote | Cotización rápida | Público |
| POST | /api/applications | Postular como freelancer | Público |
| GET | /api/projects | Mis proyectos (filtrado por rol) | Auth |
| POST | /api/projects | Crear pedido | Cliente |
| GET | /api/projects/:id | Detalle | Auth |
| PATCH | /api/projects/:id/deliver | Subir entregable | Diseñador |
| PATCH | /api/projects/:id/review | Aprobar o pedir revisión | Cliente |
| GET | /api/admin/dashboard | Stats globales | Admin |
| GET | /api/admin/designers | Diseñadores disponibles | Admin |
| PATCH | /api/admin/projects/:id/assign | Asignar diseñador | Admin |
| PATCH | /api/admin/projects/:id/complete | Cerrar y liquidar | Admin |
| GET | /api/admin/applications | Ver postulaciones | Admin |
| PATCH | /api/admin/applications/:id/evaluate | Evaluar postulante | Admin |

## Roles del sistema

- **cliente** → Crea pedidos, hace seguimiento, aprueba entregas, paga
- **disenador** → Ve asignaciones, sube entregables, ve su panel financiero
- **admin** (Jhon) → Vista global, asigna, completa proyectos, evalúa postulantes

## Deploy

- **Frontend**: Vercel (conectar `/web`)
- **Backend**: Railway (conectar `/api`)
- **Base de datos**: MongoDB Atlas (misma conexión de Fenalco o nueva DB `sapiens-colab`)
- **Archivos**: Cloudinary (mismas credenciales de Fenalco)
- **Dominio**: sapienscolab.com → Vercel

## Base tecnica inicial OpenClaw (multi-tenant)

Se agrego una base paralela para evolucionar a SaaS modular con PostgreSQL + Redis:

```
apps/
	backend/
	worker/
	web/
packages/
	types/
	shared/
	config/
modules/
	tenant auth user agent conversation message workflow ticket knowledge audit
database/
	schema.sql
docs/
	architecture.md database.md modules.md
```

### Arranque rapido de la nueva base

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev:backend:new
npm run dev:worker
```
