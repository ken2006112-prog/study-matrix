from fastapi import APIRouter, HTTPException
from typing import List
from app.db import db
from app.schemas import Subject, SubjectCreate, StudySession, StudySessionCreate

router = APIRouter()
from app.services.planner_engine import planner_engine

# --- Planner Generation ---

@router.post("/generate")
async def generate_plan():
    # TODO: Auth
    user_id = 1
    return await planner_engine.generate_initial_plan(user_id)

@router.get("/roadmap")
async def get_roadmap():
    # Return high-level study plans
    # TODO: Auth
    plans = await db.studyplan.find_many(
        include={'exam': {'include': {'subject': True}}},
        order={'weekStart': 'asc'}
    )
    return plans

# --- Adaptive Replanning (Module 3) ---
from app.services.adaptive_planner import adaptive_planner

@router.get("/check-deviation")
async def check_deviation():
    """Check how far behind the user is from their planned schedule."""
    user_id = 1  # TODO: Auth
    return await adaptive_planner.check_deviation(user_id)

@router.post("/replan")
async def trigger_replan():
    """Trigger adaptive replanning to redistribute tasks."""
    user_id = 1  # TODO: Auth
    return await adaptive_planner.trigger_replan(user_id)



# --- Subjects ---

@router.post("/subjects/", response_model=Subject)
async def create_subject(subject: SubjectCreate):
    # TODO: Get actual user ID from auth
    user_id = 1 
    
    # Ensure user exists (temporary hack for dev)
    user = await db.user.find_unique(where={'id': user_id})
    if not user:
         await db.user.create(data={'id': user_id, 'email': 'demo@example.com', 'name': 'Demo User'})

    new_subject = await db.subject.create(
        data={
            'name': subject.name,
            'color': subject.color,
            'userId': user_id
        }
    )
    return new_subject

@router.get("/subjects/", response_model=List[Subject])
async def get_subjects():
    # TODO: Filter by user ID
    subjects = await db.subject.find_many()
    return subjects

# --- Sessions ---

@router.post("/sessions/", response_model=StudySession)
async def create_session(session: StudySessionCreate):
    user_id = 1
    new_session = await db.studysession.create(
        data={
            'subjectId': session.subjectId,
            'userId': user_id,
            'startTime': session.startTime,
            'endTime': session.endTime,
            'duration': session.duration,
            'plannedDuration': session.plannedDuration,
            'isFocusMode': session.isFocusMode,
            'notes': session.notes
        }
    )
    return new_session

@router.get("/sessions/", response_model=List[StudySession])
async def get_sessions():
    sessions = await db.studysession.find_many(include={'subject': True})
    return sessions
