import io
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
THUMB_MAX_SIZE = (720, 480)
THUMB_QUALITY = 78


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def build_public_path(filename: str) -> str:
    return f"/uploads/{filename}"


def thumb_filename_for(stored_filename: str) -> str:
    stem = Path(stored_filename).stem
    return f"{stem}_thumb.webp"


async def save_upload_file(file: UploadFile) -> tuple[str, str, str, int, str | None]:
    """
    Save an uploaded image and a smaller WebP thumbnail.
    Returns:
      stored_filename, original_filename, content_type, size_bytes, thumb_filename
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, and GIF images are allowed",
        )

    data = await file.read()
    size = len(data)
    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be 5 MB or smaller",
        )

    ensure_upload_dir()
    extension = ALLOWED_CONTENT_TYPES[file.content_type]
    stored_filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_filename
    destination.write_bytes(data)

    thumb_name = create_thumbnail(destination, thumb_filename_for(stored_filename))
    original_filename = os.path.basename(file.filename or f"upload{extension}")
    return stored_filename, original_filename, file.content_type, size, thumb_name


def create_thumbnail(source_path: Path, thumb_filename: str) -> str | None:
    """
    Create a resized WebP thumbnail next to the original.
    Returns the thumbnail filename, or None if generation fails.
    """
    ensure_upload_dir()
    thumb_path = UPLOAD_DIR / thumb_filename

    try:
        with Image.open(source_path) as img:
            img = ImageOps.exif_transpose(img)
            if getattr(img, "is_animated", False):
                img.seek(0)
            img = img.convert("RGB")
            img.thumbnail(THUMB_MAX_SIZE, Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            img.save(buffer, format="WEBP", quality=THUMB_QUALITY, method=4)
            thumb_path.write_bytes(buffer.getvalue())
        return thumb_filename
    except Exception:
        if thumb_path.exists():
            thumb_path.unlink()
        return None


def delete_upload_file(filename: str | None) -> None:
    if not filename:
        return
    path = UPLOAD_DIR / filename
    if path.exists() and path.is_file():
        path.unlink()


def delete_media_files(filename: str, thumb_filename: str | None = None) -> None:
    delete_upload_file(filename)
    delete_upload_file(thumb_filename or thumb_filename_for(filename))
