# Personal Blogging Platform

A general-purpose personal blogging CMS built with React (Vite) and FastAPI.

## Current phase: Phase 14 — Analytics (SEO form included)

SEO is owner-driven. Admin → **SEO settings** stores titles, descriptions, site URL, and paste-in Google IDs. The app applies meta tags and serves `/sitemap.xml` and `/robots.txt`; the owner connects Search Console and Analytics.

Blog view counts are stored in `page_views`. Full visitor reports (countries, devices, sources) come from Google Analytics after a Measurement ID is pasted.

Default local admin (from `.env`):

- Local disk image storage in `backend/uploads/`
- Protected upload API: `POST /api/media/upload`
- Auto WebP thumbnails (`*_thumb.webp`) for list/media grids
- Blog list API omits full TipTap `content` (detail routes still return it)
- Browser lazy-loading + long-lived cache headers on `/uploads/*`
- Admin Media page + featured image / TipTap image upload
- Files are not stored in PostgreSQL (only metadata)

Default local admin (from `.env`):

```text
email: admin@example.com
password: admin123
```



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

## APIs

### Categories / Subcategories

```text
/api/categories
/api/subcategories
```

### Blogs

```text
GET    /api/blogs
POST   /api/blogs
GET    /api/blogs/{id}
PUT    /api/blogs/{id}
DELETE /api/blogs/{id}
```

Example create body:

```json
{
  "category_id": 1,
  "subcategory_id": 1,
  "title": "How to Improve Cricket Batting",
  "slug": "how-to-improve-cricket-batting",
  "excerpt": "Simple drills for better batting.",
  "featured_image": "https://example.com/cricket.jpg",
  "status": "DRAFT"
}
```

Blog `status` accepts `DRAFT`, `PUBLISHED`, or `ARCHIVED`.
Publishing a blog auto-sets `published_at` if it is empty.

### SEO / settings

```text
GET    /api/settings
PUT    /api/settings          (admin)
GET    /sitemap.xml
GET    /robots.txt
```

### Analytics

```text
POST   /api/analytics/views
GET    /api/analytics/overview   (admin)
```

Page views are stored in PostgreSQL. Paste a Google Analytics Measurement ID in Admin → SEO settings to load gtag.js. Search Console, countries, and devices stay in Google — this app does not log in for you.


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
