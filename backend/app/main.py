from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.api.endpoints.events import router as events_router
from app.services.seat_service import seed_sample_event

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Seed default venue & event
    db = SessionLocal()
    try:
        seed_sample_event(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="Event Seating & Reservation API",
    description="High-concurrency event seat hold, interactive layout, and reservation engine.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Event Seating & Reservation Engine",
        "docs_url": "/docs"
    }
