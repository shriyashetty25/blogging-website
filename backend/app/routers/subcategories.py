from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.category import Category
from app.models.subcategory import Subcategory
from app.models.user import User
from app.schemas.subcategory import (
    SubcategoryCreate,
    SubcategoryRead,
    SubcategoryUpdate,
)

router = APIRouter(prefix="/api/subcategories", tags=["subcategories"])


def get_category_or_404(category_id: int, db: Session) -> Category:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found",
        )
    return category


@router.get("", response_model=list[SubcategoryRead])
def list_subcategories(db: Session = Depends(get_db)):
    return db.query(Subcategory).order_by(Subcategory.id).all()


@router.post("", response_model=SubcategoryRead, status_code=status.HTTP_201_CREATED)
def create_subcategory(
    payload: SubcategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    get_category_or_404(payload.category_id, db)

    subcategory = Subcategory(
        category_id=payload.category_id,
        name=payload.name.strip(),
        slug=payload.slug.strip().lower(),
        description=payload.description,
        status=payload.status,
    )
    db.add(subcategory)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subcategory slug already exists",
        )

    db.refresh(subcategory)
    return subcategory


@router.get("/{subcategory_id}", response_model=SubcategoryRead)
def get_subcategory(subcategory_id: int, db: Session = Depends(get_db)):
    subcategory = (
        db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    )
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found",
        )
    return subcategory


@router.put("/{subcategory_id}", response_model=SubcategoryRead)
def update_subcategory(
    subcategory_id: int,
    payload: SubcategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    subcategory = (
        db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    )
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "category_id" in update_data and update_data["category_id"] is not None:
        get_category_or_404(update_data["category_id"], db)

    if "name" in update_data and update_data["name"] is not None:
        update_data["name"] = update_data["name"].strip()
    if "slug" in update_data and update_data["slug"] is not None:
        update_data["slug"] = update_data["slug"].strip().lower()

    for field, value in update_data.items():
        setattr(subcategory, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subcategory slug already exists",
        )

    db.refresh(subcategory)
    return subcategory


@router.delete("/{subcategory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subcategory(
    subcategory_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    subcategory = (
        db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    )
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found",
        )

    db.delete(subcategory)
    db.commit()
    return None
