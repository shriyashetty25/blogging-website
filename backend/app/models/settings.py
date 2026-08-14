from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SiteSettings(Base):
    """Single-row table for site-wide SEO and connection fields."""

    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    site_name: Mapped[str] = mapped_column(String(120), nullable=False, default="BlogSite")
    default_seo_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    default_seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    public_site_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    default_share_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_analytics_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    google_search_console_verification: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )
    robots_txt: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    author_role: Mapped[str | None] = mapped_column(String(80), nullable=True)
    author_bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
