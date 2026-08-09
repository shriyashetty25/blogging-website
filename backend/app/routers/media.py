from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.media_storage import (
    build_public_path,
    delete_media_files,
    save_upload_file,
)
from app.models.media import Media
from app.models.user import User
from app.schemas.media import MediaRead

router = APIRouter(prefix="/api/media", tags=["media"])


@router.get("", response_model=list[MediaRead])
def list_media(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(Media).order_by(Media.id.desc()).all()


@router.post("/upload", response_model=MediaRead, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    (
        stored_filename,
        original_name,
        content_type,
        size_bytes,
        thumb_filename,
    ) = await save_upload_file(file)

    media = Media(
        filename=stored_filename,
        original_name=original_name,
        content_type=content_type,
        size_bytes=size_bytes,
        url_path=build_public_path(stored_filename),
        thumb_filename=thumb_filename,
        thumb_url_path=(
            build_public_path(thumb_filename) if thumb_filename else None
        ),
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )

    delete_media_files(media.filename, media.thumb_filename)
    db.delete(media)
    db.commit()
    return None
