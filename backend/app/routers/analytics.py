from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import Date, cast, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.blog import Blog
from app.models.category import Category
from app.models.page_view import PageView
from app.models.subcategory import Subcategory
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverview,
    DailyTraffic,
    DashboardOverview,
    NavbarSlot,
    PopularBlog,
    RecentBlog,
    ViewCreate,
)

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


@router.get("/dashboard", response_model=DashboardOverview)
def analytics_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_week = now - timedelta(days=7)
    start_month = now - timedelta(days=30)
    chart_days = 30
    chart_start = (now - timedelta(days=chart_days - 1)).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    def count_since(since: datetime | None = None) -> int:
        query = db.query(func.count(PageView.id))
        if since is not None:
            query = query.filter(PageView.viewed_at >= since)
        return int(query.scalar() or 0)

    def count_blogs(status_value: str | None = None) -> int:
        query = db.query(func.count(Blog.id))
        if status_value:
            query = query.filter(Blog.status == status_value)
        return int(query.scalar() or 0)

    if db.bind.dialect.name == "sqlite":
        day_column = func.date(PageView.viewed_at)
    else:
        day_column = cast(PageView.viewed_at, Date)
    traffic_rows = (
        db.query(day_column.label("day"), func.count(PageView.id))
        .filter(PageView.viewed_at >= chart_start)
        .group_by(day_column)
        .all()
    )
    def as_date(value) -> date:
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, str):
            return date.fromisoformat(value)
        return value

    views_by_day = {as_date(row.day): int(row[1]) for row in traffic_rows}
    daily_traffic = []
    for offset in range(chart_days):
        day = (chart_start + timedelta(days=offset)).date()
        daily_traffic.append(
            DailyTraffic(date=day.isoformat(), views=views_by_day.get(day, 0))
        )

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
        .limit(8)
        .all()
    )

    recent_rows = db.query(Blog).order_by(Blog.updated_at.desc()).limit(8).all()

    navbar_rows = (
        db.query(Blog)
        .join(Category, Category.id == Blog.category_id)
        .filter(Blog.navbar_rank.in_((1, 2, 3)))
        .order_by(Blog.navbar_rank)
        .all()
    )

    return DashboardOverview(
        total_blogs=count_blogs(),
        published_blogs=count_blogs("PUBLISHED"),
        draft_blogs=count_blogs("DRAFT"),
        archived_blogs=count_blogs("ARCHIVED"),
        categories=int(db.query(func.count(Category.id)).scalar() or 0),
        subcategories=int(db.query(func.count(Subcategory.id)).scalar() or 0),
        total_views=count_since(),
        views_today=count_since(start_today),
        views_week=count_since(start_week),
        views_month=count_since(start_month),
        daily_traffic=daily_traffic,
        popular_blogs=[
            PopularBlog(id=row.id, title=row.title, slug=row.slug, views=row.views)
            for row in popular_rows
        ],
        recent_blogs=[
            RecentBlog(
                id=blog.id,
                title=blog.title,
                slug=blog.slug,
                status=blog.status,
                published_at=(
                    blog.published_at.date().isoformat() if blog.published_at else None
                ),
            )
            for blog in recent_rows
        ],
        navbar_slots=[
            NavbarSlot(
                rank=blog.navbar_rank,
                blog_id=blog.id,
                title=blog.title,
                slug=blog.slug,
                status=blog.status,
                category_name=blog.category.name,
                category_slug=blog.category.slug,
            )
            for blog in navbar_rows
        ],
    )
