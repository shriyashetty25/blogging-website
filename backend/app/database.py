import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Provide a database session for one request, then close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_blog_columns():
    """
    Simple learning-friendly migration.
    create_all() does not add new columns to existing tables, so we add them here.
    """
    statements = [
        "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS content TEXT",
        "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS tags VARCHAR(500)",
        "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200)",
        "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_description TEXT",
        "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS featured_image_thumb VARCHAR(500)",
        "ALTER TABLE media ADD COLUMN IF NOT EXISTS thumb_filename VARCHAR(255)",
        "ALTER TABLE media ADD COLUMN IF NOT EXISTS thumb_url_path VARCHAR(300)",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def backfill_media_thumbnails():
    """Generate missing WebP thumbnails for older uploads."""
    from app.media_storage import (
        UPLOAD_DIR,
        build_public_path,
        create_thumbnail,
        thumb_filename_for,
    )
    from app.models.media import Media

    db = SessionLocal()
    try:
        items = db.query(Media).filter(Media.thumb_url_path.is_(None)).all()
        changed = False
        for media in items:
            source = UPLOAD_DIR / media.filename
            if not source.exists():
                continue
            thumb_name = create_thumbnail(source, thumb_filename_for(media.filename))
            if not thumb_name:
                continue
            media.thumb_filename = thumb_name
            media.thumb_url_path = build_public_path(thumb_name)
            changed = True
        if changed:
            db.commit()
    finally:
        db.close()


def migrate_legacy_blog_tags():
    """
    Move old comma-separated blogs.tags text into tags + blog_tags tables.
    Safe to run many times: skips blogs that already have tag links.
    """
    from app.models.blog import Blog
    from app.models.tag import Tag
    from app.utils.slugify import slugify

    db = SessionLocal()
    try:
        rows = db.execute(
            text(
                """
                SELECT id, tags
                FROM blogs
                WHERE tags IS NOT NULL
                  AND TRIM(tags) <> ''
                  AND id NOT IN (SELECT blog_id FROM blog_tags)
                """
            )
        ).fetchall()

        for blog_id, tags_text in rows:
            blog = db.query(Blog).filter(Blog.id == blog_id).first()
            if not blog:
                continue

            tag_objects = []
            seen = set()
            for raw in str(tags_text).split(","):
                name = raw.strip()
                if not name:
                    continue
                tag_slug = slugify(name)
                if not tag_slug or tag_slug in seen:
                    continue
                seen.add(tag_slug)

                tag = db.query(Tag).filter(Tag.slug == tag_slug).first()
                if not tag:
                    tag = Tag(name=name, slug=tag_slug)
                    db.add(tag)
                    db.flush()
                tag_objects.append(tag)

            blog.tags = tag_objects

        db.commit()
    finally:
        db.close()
