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
