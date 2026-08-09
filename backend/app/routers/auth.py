from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import create_access_token, verify_password
from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    token = create_access_token(user.email)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserRead)
def read_me(current_admin: User = Depends(get_current_admin)):
    return current_admin


@router.post("/logout")
def logout(current_admin: User = Depends(get_current_admin)):
    # JWT is stateless; client deletes the token on logout.
    return {"detail": "Logged out"}
