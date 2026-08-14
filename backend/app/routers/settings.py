from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.user import User
from app.schemas.settings import SiteSettingsRead, SiteSettingsUpdate
from app.site_settings import get_or_create_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SiteSettingsRead)
def read_settings(db: Session = Depends(get_db)):
    """Public — the website needs these values for titles, meta tags, and analytics."""
    return get_or_create_settings(db)


@router.put("", response_model=SiteSettingsRead)
def update_settings(
    payload: SiteSettingsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    settings = get_or_create_settings(db)
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip() or None
            if field == "site_name" and value is None:
                value = "BlogSite"
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
