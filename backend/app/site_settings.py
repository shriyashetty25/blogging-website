from sqlalchemy.orm import Session

from app.models.settings import SiteSettings

DEFAULT_DESCRIPTION = (
    "A personal magazine for culture, focus, sport, and everyday life."
)


def get_or_create_settings(db: Session) -> SiteSettings:
    settings = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
    if settings:
        return settings

    settings = SiteSettings(
        id=1,
        site_name="BlogSite",
        default_seo_title="BlogSite",
        default_seo_description=DEFAULT_DESCRIPTION,
        public_site_url="http://localhost:5173",
        robots_txt=None,
        author_name="Editor",
        author_role="Writer",
        author_bio=(
            "Writes for BlogSite on culture, focus, sport, and everyday life."
        ),
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def normalize_site_url(url: str | None) -> str:
    value = (url or "").strip().rstrip("/")
    return value or "http://localhost:5173"


def default_robots_txt(site_url: str) -> str:
    return (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "\n"
        f"Sitemap: {site_url}/sitemap.xml\n"
    )
