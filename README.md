# Holdmind

Memory-augmented AI chatbot. Conversations are stored, memories are extracted from them, and a belief graph tracks what the model knows about you over time.

**Stack:** FastAPI · PostgreSQL · Qdrant · Next.js 16 · TypeScript

---

## Architecture

```
browser  ──→  Next.js (Vercel)  ──→  /api/* rewrite  ──→  FastAPI (DigitalOcean)
                                                               │
                                                        PostgreSQL (Aiven)
                                                        Qdrant (vector store)
                                                        SQLite (memory graphs, per-user)
```

Authentication uses a two-token system: a 7-day JWT in `localStorage` for API calls, and a 30-day opaque refresh token in an `httpOnly` cookie for silent re-authentication.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.13+ | |
| [uv](https://docs.astral.sh/uv/) | latest | Backend package manager |
| Node.js | 20+ | |
| pnpm | 9+ | Frontend package manager |
| PostgreSQL | 14+ | Aiven free tier works |
| Qdrant | latest | Docker or Qdrant Cloud |

---

## Local Development

### 1. Clone and set up backend

```bash
cd backend
cp .env.example .env      # fill in real values (see table below)
uv sync --extra dev
```

Apply database migrations:

```bash
DATABASE_URL="postgresql://..." uv run alembic upgrade head
```

Start the API server:

```bash
uv run uvicorn main:app --reload --port 8000
```

### 2. Set up frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The Next.js dev server proxies `/api/*` → `http://localhost:8000` automatically. **Do not set `NEXT_PUBLIC_API_URL`** in local dev — leaving it unset ensures all API calls go through the proxy, which is required for the `httpOnly` refresh token cookie to work.

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET_KEY` | ✅ | Secret for signing JWTs. Use a random 32+ char string. |
| `ENCRYPTION_KEY` | ✅ | Base64-encoded 32-byte key for encrypting OpenRouter API keys at rest. Generate: `python -c "import secrets,base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Must use `postgresql://` prefix (not `postgres://`). Example: `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `QDRANT_URL` | ✅ | Qdrant instance URL. Example: `http://localhost:6333` |
| `QDRANT_API_KEY` | ✅ | Qdrant API key (empty string `""` for local Qdrant with no auth) |
| `MEMORY_DB_DIR` | ✅ | Directory for per-user SQLite memory graphs. Example: `/data/memories` (created on first run) |
| `CORS_ORIGINS` | optional | JSON list of allowed origins. Default: `["http://localhost:3000"]` |

### Frontend

No `.env.local` is needed for local development. In production, set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL. Only set this in production when the API lives on a different domain. Leave unset otherwise. |

---

## Database Migrations

Migrations are managed with Alembic. The migration history is in `backend/alembic/versions/`.

```bash
# Apply all pending migrations
cd backend && DATABASE_URL="postgresql://..." uv run alembic upgrade head

# Check current revision
cd backend && DATABASE_URL="postgresql://..." uv run alembic current

# Roll back one revision
cd backend && DATABASE_URL="postgresql://..." uv run alembic downgrade -1
```

---

## Running Tests

```bash
cd backend
uv run pytest tests/ -v
```

Tests use an in-memory SQLite database. No external services required.

---

## Project Structure

```
holdmind/
├── backend/
│   ├── alembic/            # DB migrations
│   ├── auth/               # JWT decode, dependencies, cookie helpers
│   ├── models/             # SQLAlchemy ORM models
│   ├── routes/             # FastAPI routers (auth, chat, conversations, memories, settings, token)
│   ├── schemas/            # Pydantic request/response schemas
│   ├── services/           # Business logic (auth, chat, memory, token)
│   ├── tests/              # pytest test suite
│   ├── config.py           # Pydantic settings (reads from .env)
│   ├── main.py             # FastAPI app, middleware, router registration
│   └── .env.example        # Template for required env vars
└── frontend/
    ├── app/                # Next.js App Router pages
    ├── components/         # React components
    ├── lib/
    │   ├── api.ts          # apiFetch wrapper (JWT auth, 401 refresh interceptor)
    │   └── auth-context.tsx # AuthProvider, login/logout
    └── middleware.ts       # Route protection (redirects unauthenticated users)
```

---

## Rate Limits

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/auth/signup` | 5/min | IP |
| `POST /api/auth/signin` | 5/min | IP |
| `POST /api/chat` | 20/min | User ID |
| All other endpoints | 60/min | User ID |
| `GET /health` | 200/min | IP |
