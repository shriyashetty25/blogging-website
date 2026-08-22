from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tag import TagRead


class BlogCreate(BaseModel):
    category_id: int
    subcategory_id: int
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=220)
    excerpt: str | None = None
    featured_image: str | None = None
    featured_image_thumb: str | None = None
    author: str | None = Field(default=None, max_length=120)
    content: str | None = None
    tag_names: list[str] = Field(default_factory=list)
    seo_title: str | None = Field(default=None, max_length=200)
    seo_description: str | None = None
    navbar_rank: int | None = Field(default=None, ge=1, le=3)
    status: str = Field(default="DRAFT", pattern="^(DRAFT|PUBLISHED|ARCHIVED)$")
    published_at: datetime | None = None


class BlogUpdate(BaseModel):
    category_id: int | None = None
    subcategory_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=220)
    excerpt: str | None = None
    featured_image: str | None = None
    featured_image_thumb: str | None = None
    author: str | None = Field(default=None, max_length=120)
    content: str | None = None
    tag_names: list[str] | None = None
    seo_title: str | None = Field(default=None, max_length=200)
    seo_description: str | None = None
    navbar_rank: int | None = Field(default=None, ge=1, le=3)
    status: str | None = Field(default=None, pattern="^(DRAFT|PUBLISHED|ARCHIVED)$")
    published_at: datetime | None = None


class BlogListItem(BaseModel):
    """Lean list payload — omits full TipTap content so image-heavy posts stay fast."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    subcategory_id: int
    title: str
    slug: str
    excerpt: str | None
    featured_image: str | None
    featured_image_thumb: str | None = None
    author: str | None = None
    tags: list[TagRead] = Field(default_factory=list)
    seo_title: str | None
    seo_description: str | None
    navbar_rank: int | None = None
    status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class NavbarCategory(BaseModel):
    rank: int
    name: str
    slug: str


class BlogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    subcategory_id: int
    title: str
    slug: str
    excerpt: str | None
    featured_image: str | None
    featured_image_thumb: str | None = None
    author: str | None = None
    content: str | None
    tags: list[TagRead] = Field(default_factory=list)
    seo_title: str | None
    seo_description: str | None
    navbar_rank: int | None = None
    status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
