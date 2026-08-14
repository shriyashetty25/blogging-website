from datetime import timezone

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.blog import Blog
from app.models.category import Category
from app.models.subcategory import Subcategory
from app.site_settings import (
    default_robots_txt,
    get_or_create_settings,
    normalize_site_url,
)

router = APIRouter(tags=["seo-files"])


def _loc(site_url: str, path: str) -> str:
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{site_url}{path}"


def _lastmod(value) -> str:
    if value is None:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.date().isoformat()


@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)):
    settings = get_or_create_settings(db)
    site_url = normalize_site_url(settings.public_site_url)
    urls = [
        ("/", None),
        ("/blogs", None),
    ]

    categories = (
        db.query(Category)
        .filter(Category.status == "active")
        .order_by(Category.id)
        .all()
    )
    subcategories = (
        db.query(Subcategory)
        .filter(Subcategory.status == "active")
        .order_by(Subcategory.id)
        .all()
    )
    blogs = (
        db.query(Blog)
        .filter(Blog.status == "PUBLISHED")
        .order_by(Blog.published_at.desc())
        .all()
    )

    for category in categories:
        urls.append((f"/{category.slug}", category.updated_at))
    for subcategory in subcategories:
        category = next((item for item in categories if item.id == subcategory.category_id), None)
        if category:
            urls.append(
                (f"/{category.slug}/{subcategory.slug}", subcategory.updated_at),
            )
    for blog in blogs:
        urls.append((f"/blog/{blog.slug}", blog.updated_at or blog.published_at))

    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path, stamp in urls:
        parts.append("  <url>")
        parts.append(f"    <loc>{_loc(site_url, path)}</loc>")
        lastmod = _lastmod(stamp)
        if lastmod:
            parts.append(f"    <lastmod>{lastmod}</lastmod>")
        parts.append("  </url>")
    parts.append("</urlset>")
    parts.append("")

    return Response(content="\n".join(parts), media_type="application/xml")


@router.get("/robots.txt")
def robots(db: Session = Depends(get_db)):
    settings = get_or_create_settings(db)
    site_url = normalize_site_url(settings.public_site_url)
    body = (settings.robots_txt or "").strip() or default_robots_txt(site_url)
    return Response(content=body + "\n", media_type="text/plain")
