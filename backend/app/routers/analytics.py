from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.blog import Blog
from app.models.page_view import PageView
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview, PopularBlog, ViewCreate

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/views", status_code=status.HTTP_204_NO_CONTENT)
def record_view(payload: ViewCreate, db: Session = Depends(get_db)):
    path = payload.path.strip()
    if not path.startswith("/"):
        path = f"/{path}"
    if path.startswith("/admin"):
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    blog_id = payload.blog_id
    if blog_id is not None:
        blog = (
            db.query(Blog)
            .filter(Blog.id == blog_id, Blog.status == "PUBLISHED")
            .first()
        )
        if not blog:
            blog_id = None

    path = path[:300]
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=8)
    duplicate_query = db.query(PageView.id).filter(
        PageView.path == path,
        PageView.viewed_at >= cutoff,
    )
    if blog_id is None:
        duplicate_query = duplicate_query.filter(PageView.blog_id.is_(None))
    else:
        duplicate_query = duplicate_query.filter(PageView.blog_id == blog_id)

    if duplicate_query.first():
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    db.add(PageView(blog_id=blog_id, path=path))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/overview", response_model=AnalyticsOverview)
def analytics_overview(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_week = now - timedelta(days=7)
    start_month = now - timedelta(days=30)

    def count_since(since: datetime | None = None, blog_only: bool = False) -> int:
        query = db.query(func.count(PageView.id))
        if since is not None:
            query = query.filter(PageView.viewed_at >= since)
        if blog_only:
            query = query.filter(PageView.blog_id.isnot(None))
        return int(query.scalar() or 0)

    popular_rows = (
        db.query(
            Blog.id,
            Blog.title,
            Blog.slug,
            func.count(PageView.id).label("views"),
        )
        .join(PageView, PageView.blog_id == Blog.id)
        .group_by(Blog.id)
        .order_by(func.count(PageView.id).desc())
        .limit(10)
        .all()
    )

    return AnalyticsOverview(
        page_views=count_since(),
        blog_views=count_since(blog_only=True),
        views_today=count_since(start_today),
        views_week=count_since(start_week),
        views_month=count_since(start_month),
        popular_blogs=[
            PopularBlog(id=row.id, title=row.title, slug=row.slug, views=row.views)
            for row in popular_rows
        ],
    )
