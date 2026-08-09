import os

from app.auth.security import hash_password
from app.database import SessionLocal
from app.models.user import User


def seed_admin_user() -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "admin123")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return

        admin = User(
            email=email,
            hashed_password=hash_password(password),
            role="ADMIN",
        )
        db.add(admin)
        db.commit()
        print(f"Seeded admin user: {email}")
    finally:
        db.close()
