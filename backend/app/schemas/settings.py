from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SiteSettingsUpdate(BaseModel):
    site_name: str | None = Field(default=None, min_length=1, max_length=120)
    default_seo_title: str | None = Field(default=None, max_length=200)
    default_seo_description: str | None = None
    public_site_url: str | None = Field(default=None, max_length=300)
    default_share_image: str | None = Field(default=None, max_length=500)
    google_analytics_id: str | None = Field(default=None, max_length=40)
    google_search_console_verification: str | None = Field(default=None, max_length=120)
    robots_txt: str | None = None
    author_name: str | None = Field(default=None, max_length=120)
    author_role: str | None = Field(default=None, max_length=80)
    author_bio: str | None = None
    author_image: str | None = Field(default=None, max_length=500)


class SiteSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_name: str
    default_seo_title: str | None
    default_seo_description: str | None
    public_site_url: str | None
    default_share_image: str | None
    google_analytics_id: str | None
    google_search_console_verification: str | None
    robots_txt: str | None
    author_name: str | None = None
    author_role: str | None = None
    author_bio: str | None = None
    author_image: str | None = None
    updated_at: datetime
