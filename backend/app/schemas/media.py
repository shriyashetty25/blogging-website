from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    original_name: str
    content_type: str
    size_bytes: int
    url_path: str
    thumb_url_path: str | None = None
    created_at: datetime
