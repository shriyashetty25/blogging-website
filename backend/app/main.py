from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth.seed import seed_admin_user
from app.database import (
    Base,
    backfill_media_thumbnails,
    engine,
    ensure_blog_columns,
    migrate_legacy_blog_tags,
)
from app.media_storage import UPLOAD_DIR, ensure_upload_dir
from app.models import Blog, Category, Media, Subcategory, Tag, User  # noqa: F401
from app.routers import auth, blogs, categories, media, subcategories, tags

app = FastAPI(title="Personal Blogging Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def cache_uploaded_media(request, call_next):
    """UUID-named uploads are immutable — let browsers cache them aggressively."""
    response = await call_next(request)
    if request.url.path.startswith("/uploads/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


# Create tables if they do not exist yet (simple approach for learning).
Base.metadata.create_all(bind=engine)
ensure_blog_columns()
migrate_legacy_blog_tags()
seed_admin_user()
ensure_upload_dir()
backfill_media_thumbnails()

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(subcategories.router)
app.include_router(blogs.router)
app.include_router(tags.router)
app.include_router(media.router)

# Serve uploaded images from local disk (not from PostgreSQL).
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
