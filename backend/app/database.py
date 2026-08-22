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
        "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS author VARCHAR(120)",
        "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS navbar_rank INTEGER",
        "ALTER TABLE media ADD COLUMN IF NOT EXISTS thumb_filename VARCHAR(255)",
        "ALTER TABLE media ADD COLUMN IF NOT EXISTS thumb_url_path VARCHAR(300)",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
        connection.execute(
            text(
                "UPDATE blogs SET author = 'Editor' "
                "WHERE author IS NULL OR TRIM(author) = ''"
            )
        )
        for statement in [
            "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS author_name VARCHAR(120)",
            "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS author_role VARCHAR(80)",
            "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS author_bio TEXT",
            "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS author_image VARCHAR(500)",
        ]:
            connection.execute(text(statement))
        connection.execute(
            text(
                """
                UPDATE site_settings
                SET
                  author_name = COALESCE(NULLIF(TRIM(author_name), ''), 'Editor'),
                  author_role = COALESCE(NULLIF(TRIM(author_role), ''), 'Writer'),
                  author_bio = COALESCE(
                    NULLIF(TRIM(author_bio), ''),
                    'Writes for BlogSite on culture, focus, sport, and everyday life.'
                  )
                WHERE id = 1
                """
            )
        )


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


def seed_navbar_ranks():
    """If no navbar slots are set, pick three published posts from different categories."""
    from app.models.blog import Blog
    from app.models.category import Category

    db = SessionLocal()
    try:
        already_ranked = db.query(Blog).filter(Blog.navbar_rank.isnot(None)).count()
        if already_ranked:
            return

        published = (
            db.query(Blog)
            .join(Category, Category.id == Blog.category_id)
            .filter(Blog.status == "PUBLISHED", Category.status == "active")
            .order_by(Blog.published_at.desc().nullslast(), Blog.id.desc())
            .all()
        )
        seen_categories = set()
        rank = 1
        for blog in published:
            if blog.category_id in seen_categories:
                continue
            blog.navbar_rank = rank
            seen_categories.add(blog.category_id)
            rank += 1
            if rank > 3:
                break
        db.commit()
    finally:
        db.close()
