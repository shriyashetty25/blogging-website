from pydantic import BaseModel, Field


class ViewCreate(BaseModel):
    path: str = Field(min_length=1, max_length=300)
    blog_id: int | None = None


class PopularBlog(BaseModel):
    id: int
    title: str
    slug: str
    views: int


class AnalyticsOverview(BaseModel):
    page_views: int
    blog_views: int
    views_today: int
    views_week: int
    views_month: int
    popular_blogs: list[PopularBlog]


class DailyTraffic(BaseModel):
    date: str
    views: int


class RecentBlog(BaseModel):
    id: int
    title: str
    slug: str
    status: str
    published_at: str | None = None


class NavbarSlot(BaseModel):
    rank: int
    blog_id: int
    title: str
    slug: str
    status: str
    category_name: str
    category_slug: str


class DashboardOverview(BaseModel):
    total_blogs: int
    published_blogs: int
    draft_blogs: int
    archived_blogs: int
    categories: int
    subcategories: int
    total_views: int
    views_today: int
    views_week: int
    views_month: int
    daily_traffic: list[DailyTraffic]
    popular_blogs: list[PopularBlog]
    recent_blogs: list[RecentBlog]
    navbar_slots: list[NavbarSlot]
