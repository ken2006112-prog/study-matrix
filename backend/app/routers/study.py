from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

# Import Services
from app.services.scheduler import FSRSScheduler
from app.services.session import CognitiveLoadRegulator
from app.services.coach import SocraticCoach
from app.db import db

# Pydantic Models for Req/Res
class UserState(BaseModel):
    userId: int
    fatigueLevel: int # 1-10
    stressLevel: int # 1-10
    mood: str
    recentLoad: str # "HIGH", "MEDIUM", "LOW"

class NextTaskRequest(BaseModel):
    userState: UserState

class FlashcardLogRequest(BaseModel):
    flashcardId: int
    rating: int # 1-4
    confidence: int # 0-100
    duration: int # ms

class CheckInRequest(BaseModel):
    userId: int
    sleepQuality: int # 1-10
    stressLevel: int # 1-10
    mood: str # e.g. "CALM"

router = APIRouter(prefix="/study", tags=["Study Agent"])
coach = SocraticCoach()

@router.post("/next-task")
async def get_next_task(req: NextTaskRequest):
    """
    Get the next best task based on cognitive state.
    """
    # 1. Cognitive Load Recommendation
    # Determine basic mode (FOCUS vs REVIEW)
    session_rec = CognitiveLoadRegulator.recommend_session_type(
        recent_sessions=[], # Ideally fetch from DB history
        current_hour=None
    )
    
    # 2. Socratic Guidance
    # Ask AI to explain the recommendation or suggest alternatives
    guidance = await coach.get_socratic_guidance(
        user_state=req.userState.dict(),
        options=[
            {"id": "FOCUS", "label": "Deep Work (High Load)"},
            {"id": "REVIEW", "label": "Flashcard Review (Low Load)"}
        ]
    )
    
    return {
        "recommendation": session_rec,
        "coach_guidance": guidance,
        # In a real app, we would fetch actual tasks here
        "tasks": [] 
    }

@router.post("/review/log")
async def log_review(req: FlashcardLogRequest):
    """
    Log a flashcard review and update FSRS parameters.
    """
    # 1. Fetch card 
    card = await db.flashcard.find_unique(where={'id': req.flashcardId})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # 2. Calculate next interval using FSRS
    next_schedule = FSRSScheduler.calculate_next_review(
        stability=card.stability, 
        difficulty=card.difficulty,
        rating=req.rating,
        last_review=datetime.now(), 
        sleep_quality=None 
    )
    
    # 3. Update DB
    await db.flashcard.update(
        where={'id': req.flashcardId},
        data={
            'stability': next_schedule['stability'],
            'difficulty': next_schedule['difficulty'],
            'lastReview': datetime.now(),
            'due': next_schedule['next_due'],
            'reviews': {
                 'create': {
                     'rating': req.rating,
                     'confidence': req.confidence,
                     'actualResult': req.rating > 1, # Simplified logic
                     'calibrationErr': req.confidence - (100 if req.rating > 1 else 0), # Simple calc
                     'duration': req.duration
                 }
            }
        }
    )
    
    return {
        "status": "logged",
        "next_review": next_schedule['next_due'],
        "interval_days": next_schedule['interval_days']
    }

@router.post("/check-in")
async def check_in(req: CheckInRequest):
    """
    Log user wellbeing (Sleep, Stress, Mood).
    """
    try:
        record = await db.userwellbeing.create(
            data={
                'userId': req.userId,
                'sleepQuality': req.sleepQuality,
                'stressLevel': req.stressLevel,
                'mood': req.mood,
                'date': datetime.now()
            }
        )
        return {"status": "success", "id": record.id}
    except Exception as e:
        print(f"DB Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/activity")
async def get_activity_heatmap():
    """
    Get study activity heatmap data (Flashcard reviews + Completed Sessions).
    Returns list of {date: "YYYY-MM-DD", count: int, level: int}
    """
    # 1. Flashcard Reviews
    # Prisma doesn't have easy group_by date in Python client yet, use Raw query or fetch all (not efficient but fine for MVP)
    # For MVP, let's use raw query for performance on SQLite/Postgres
    
    try:
        # Aggregating Flashcard Reviews
        # Valid for SQLite. For Postgres, use TO_CHAR or DATE_TRUNC
        # Assuming SQLite for local dev based on previous context, but safer to do python-side agg for now if volume low
        
        # Method 2: Python-side aggregation (Safe)
        reviews = await db.flashcardreview.find_many(
            take=1000,
            order={'createdAt': 'desc'},
            include={'flashcard': False}
        )
        
        # Sessions
        sessions = await db.studysession.find_many(
            take=1000,
            order={'startTime': 'desc'},
            where={'endTime': {'not': None}} # Complted sessions
        )
        
        activity_map = {}
        
        for r in reviews:
            date_str = r.createdAt.date().isoformat()
            activity_map[date_str] = activity_map.get(date_str, 0) + 1
            
        for s in sessions:
            date_str = s.startTime.date().isoformat()
            # Sessions count as 5 points
            activity_map[date_str] = activity_map.get(date_str, 0) + 5
            
        # Format for frontend
        result = []
        for date_str, count in activity_map.items():
            level = 0
            if count > 0: level = 1
            if count > 5: level = 2
            if count > 10: level = 3
            if count > 20: level = 4
            
            result.append({
                "date": date_str,
                "count": count,
                "level": level
            })
            
        return result

    except Exception as e:
        print(f"Heatmap Error: {e}")
        return []
