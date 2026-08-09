from sqlalchemy import Column, ForeignKey, Table

from app.database import Base

blog_tags = Table(
    "blog_tags",
    Base.metadata,
    Column(
        "blog_id",
        ForeignKey("blogs.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
