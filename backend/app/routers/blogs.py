from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.blog import Blog
from app.models.category import Category
from app.models.page_view import PageView
from app.models.subcategory import Subcategory
from app.models.tag import Tag
from app.models.user import User
from app.schemas.blog import BlogCreate, BlogListItem, BlogRead, BlogUpdate
from app.utils.slugify import slugify

router = APIRouter(prefix="/api/blogs", tags=["blogs"])


def validate_category_and_subcategory(
    category_id: int,
    subcategory_id: int,
    db: Session,
) -> None:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found",
        )

    subcategory = (
        db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    )
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subcategory not found",
        )

    if subcategory.category_id != category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subcategory does not belong to the selected category",
        )


def resolve_published_at(
    status_value: str,
    published_at: datetime | None,
    existing_published_at: datetime | None = None,
) -> datetime | None:
    if status_value == "PUBLISHED":
        return published_at or existing_published_at or datetime.now(timezone.utc)
    if status_value in ("DRAFT", "ARCHIVED"):
        return published_at if published_at is not None else existing_published_at
    return published_at


def sync_blog_tags(blog: Blog, tag_names: list[str], db: Session) -> None:
    tags = []
    seen_slugs = set()

    for raw_name in tag_names:
        name = raw_name.strip()
        if not name:
            continue

        tag_slug = slugify(name)
        if not tag_slug or tag_slug in seen_slugs:
            continue

        seen_slugs.add(tag_slug)
        tag = db.query(Tag).filter(Tag.slug == tag_slug).first()
        if not tag:
            tag = Tag(name=name, slug=tag_slug)
            db.add(tag)
            db.flush()
        tags.append(tag)

    blog.tags = tags


@router.get("", response_model=list[BlogListItem])
def list_blogs(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    category_id: int | None = None,
    subcategory_id: int | None = None,
    q: str | None = None,
):
    """
    List endpoint returns lean items (no full content body).
    Full TipTap JSON is only loaded on detail routes.
    """
    query = db.query(Blog)

    if status_filter:
        query = query.filter(Blog.status == status_filter)
    if category_id is not None:
        query = query.filter(Blog.category_id == category_id)
    if subcategory_id is not None:
        query = query.filter(Blog.subcategory_id == subcategory_id)
    if q:
        pattern = f"%{q.strip()}%"
        query = (
            query.outerjoin(Blog.tags)
            .filter(
                or_(
                    Blog.title.ilike(pattern),
                    Blog.excerpt.ilike(pattern),
                    Tag.name.ilike(pattern),
                    Tag.slug.ilike(pattern),
                )
            )
            .distinct()
        )

    return query.order_by(Blog.id.desc()).all()


@router.get("/popular", response_model=list[BlogListItem])
def popular_blogs(db: Session = Depends(get_db), limit: int = Query(default=5, ge=1, le=12)):
    return (
        db.query(Blog)
        .outerjoin(PageView, PageView.blog_id == Blog.id)
        .filter(Blog.status == "PUBLISHED")
        .group_by(Blog.id)
        .order_by(func.count(PageView.id).desc(), Blog.id.desc())
        .limit(limit)
        .all()
    )


@router.get("/by-slug/{slug}", response_model=BlogRead)
def get_blog_by_slug(slug: str, db: Session = Depends(get_db)):
    blog = db.query(Blog).filter(Blog.slug == slug).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found",
        )
    return blog


@router.post("", response_model=BlogRead, status_code=status.HTTP_201_CREATED)
def create_blog(
    payload: BlogCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    validate_category_and_subcategory(
        payload.category_id,
        payload.subcategory_id,
        db,
    )

    blog = Blog(
        category_id=payload.category_id,
        subcategory_id=payload.subcategory_id,
        title=payload.title.strip(),
        slug=payload.slug.strip().lower(),
        excerpt=payload.excerpt,
        featured_image=payload.featured_image,
        featured_image_thumb=payload.featured_image_thumb,
        author=(payload.author.strip() if payload.author else None) or "Editor",
        content=payload.content,
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
        status=payload.status,
        published_at=resolve_published_at(payload.status, payload.published_at),
    )
    db.add(blog)
    db.flush()
    sync_blog_tags(blog, payload.tag_names, db)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Blog slug already exists",
        )

    db.refresh(blog)
    return blog


@router.get("/{blog_id}", response_model=BlogRead)
def get_blog(blog_id: int, db: Session = Depends(get_db)):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found",
        )
    return blog


@router.put("/{blog_id}", response_model=BlogRead)
def update_blog(
    blog_id: int,
    payload: BlogUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    tag_names = update_data.pop("tag_names", None)

    next_category_id = update_data.get("category_id", blog.category_id)
    next_subcategory_id = update_data.get("subcategory_id", blog.subcategory_id)

    if "category_id" in update_data or "subcategory_id" in update_data:
        validate_category_and_subcategory(
            next_category_id,
            next_subcategory_id,
            db,
        )

    if "title" in update_data and update_data["title"] is not None:
        update_data["title"] = update_data["title"].strip()
    if "slug" in update_data and update_data["slug"] is not None:
        update_data["slug"] = update_data["slug"].strip().lower()
    if "author" in update_data and update_data["author"] is not None:
        update_data["author"] = update_data["author"].strip() or "Editor"

    next_status = update_data.get("status", blog.status)
    if "status" in update_data or "published_at" in update_data:
        update_data["published_at"] = resolve_published_at(
            next_status,
            update_data.get("published_at"),
            blog.published_at,
        )

    for field, value in update_data.items():
        setattr(blog, field, value)

    if tag_names is not None:
        sync_blog_tags(blog, tag_names, db)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Blog slug already exists",
        )

    db.refresh(blog)
    return blog


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found",
        )

    db.delete(blog)
    db.commit()
    return None
