# Personal Blogging Platform

A general-purpose personal blogging CMS built with React (Vite) and FastAPI.

## Current phase: Phase 4 — Category Admin

- React admin UI for categories at `/admin/categories`
- Frontend calls FastAPI category APIs (no dummy category data)

## Requirements

- Node.js 18+
- npm
- Python 3.12+
- PostgreSQL (local Docker container used for development)

## Database (development)

If the Postgres container is not running:

```bash
docker start blog-postgres
# or create it once:
docker run -d --name blog-postgres \
  -e POSTGRES_USER=blog_user \
  -e POSTGRES_PASSWORD=blog_pass \
  -e POSTGRES_DB=blog_db \
  -p 5433:5432 \
  postgres:16
```

Backend env file:

```bash
cd backend
cp .env.example .env
```

## Run the backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health
- Categories: http://localhost:8000/api/categories

## Run the frontend

```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

## Category API

```text
GET    /api/categories
POST   /api/categories
GET    /api/categories/{id}
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

Example create body:

```json
{
  "name": "Sports",
  "slug": "sports",
  "description": "Sports related articles",
  "status": "active"
}
```

`status` accepts `active` or `disabled`.

## Project structure (Phase 3)

```text
blogging-website/
├── frontend/
└── backend/
    ├── .env.example
    ├── requirements.txt
    └── app/
        ├── main.py
        ├── database.py
        ├── models/category.py
        ├── schemas/category.py
        └── routers/categories.py
```
