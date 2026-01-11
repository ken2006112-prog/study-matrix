from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import planner, concepts, flashcards, analytics, chat, tasks, tutor, semester, encouragement
from app.db import db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    if db.is_connected():
        await db.disconnect()

app = FastAPI(title="EduMate 2.0 API", lifespan=lifespan)

app.include_router(planner.router, prefix="/api/v1/planner", tags=["planner"])
app.include_router(concepts.router, prefix="/api/v1/concepts", tags=["concepts"])
app.include_router(flashcards.router, prefix="/api/v1/cards", tags=["cards"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(tutor.router, prefix="/api/v1/chat", tags=["tutor"])
app.include_router(semester.router, prefix="/api/v1/semester", tags=["semester"])
app.include_router(encouragement.router, prefix="/api/v1/motivation", tags=["motivation"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to EduMate 2.0 API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
