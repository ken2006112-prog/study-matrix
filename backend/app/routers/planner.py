from fastapi import APIRouter, HTTPException
from typing import List
from app.db import db
from app.schemas import Subject, SubjectCreate, StudySession, StudySessionCreate

router = APIRouter()


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
