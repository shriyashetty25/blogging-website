from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import Category, Subcategory  # noqa: F401
from app.routers import categories, subcategories

app = FastAPI(title="Personal Blogging Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables if they do not exist yet (simple approach for learning).
Base.metadata.create_all(bind=engine)

app.include_router(categories.router)
app.include_router(subcategories.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
