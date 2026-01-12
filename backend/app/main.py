from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import planner, concepts, flashcards, analytics, chat, tasks, tutor, semester, encouragement, memory, analysis, strategies, prompts, ai_tutor, auth, materials, calendar, coach, agent, study
from app.db import db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    if db.is_connected():
        await db.disconnect()

app = FastAPI(title="Study Matrix API", lifespan=lifespan)

# Auth first
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

app.include_router(planner.router, prefix="/api/v1/planner", tags=["planner"])
app.include_router(concepts.router, prefix="/api/v1/concepts", tags=["concepts"])
app.include_router(flashcards.router, prefix="/api/v1/cards", tags=["cards"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(tutor.router, prefix="/api/v1/chat", tags=["tutor"])
app.include_router(semester.router, prefix="/api/v1/semester", tags=["semester"])
app.include_router(encouragement.router, prefix="/api/v1/motivation", tags=["motivation"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["memory"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(strategies.router, prefix="/api/v1/strategies", tags=["strategies"])
app.include_router(prompts.router, prefix="/api/v1/prompts", tags=["prompts"])
app.include_router(ai_tutor.router, prefix="/api/v1/ai-tutor", tags=["ai-tutor"])
app.include_router(materials.router, prefix="/api/v1/materials", tags=["materials"])
app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["calendar"])
app.include_router(coach.router, prefix="/api/v1/coach", tags=["coach"])
app.include_router(agent.router, prefix="/api/v1/agent", tags=["agent"])
app.include_router(study.router, prefix="/api/v1/study", tags=["study_agent"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev to prevent blocking
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
