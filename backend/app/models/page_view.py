from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PageView(Base):
    __tablename__ = "page_views"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    blog_id: Mapped[int | None] = mapped_column(
        ForeignKey("blogs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    path: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    viewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    blog = relationship("Blog")
