from fastapi import APIRouter
from typing import Dict
from app.db import db
from datetime import datetime
import datetime as dt

router = APIRouter()

@router.get("/summary")
async def get_analytics_summary():
    # In a real app, strict user filtering and date ranges
    user_id = 1
    
    sessions = await db.studysession.find_many(
        where={'userId': user_id},
        include={'subject': True}
    )
    
    total_duration_minutes = sum([s.duration for s in sessions if s.duration])
    total_planned_minutes = sum([s.plannedDuration for s in sessions if s.plannedDuration])
    total_sessions = len(sessions)
    
    # Calculate Time Honesty (Actual vs Planned Ratio for sessions that have both)
    # Filter sessions with both
    valid_sessions = [s for s in sessions if s.duration and s.plannedDuration]
    honesty_ratio = 1.0
    if valid_sessions:
        total_valid_actual = sum([s.duration for s in valid_sessions])
        total_valid_planned = sum([s.plannedDuration for s in valid_sessions])
        if total_valid_planned > 0:
            honesty_ratio = total_valid_actual / total_valid_planned
            
    # Group by subject
    subject_stats = {}
    for s in sessions:
        if not s.subject: continue
        sub_name = s.subject.name
        dur = s.duration if s.duration else 0
        if sub_name not in subject_stats:
            subject_stats[sub_name] = 0
        subject_stats[sub_name] += dur
        
    return {
        "total_study_hours": round(total_duration_minutes / 60, 2),
        "total_sessions": total_sessions,
        "time_honesty_ratio": round(honesty_ratio * 100, 1), # Percentage
        "subject_breakdown": [{"name": k, "value": v} for k, v in subject_stats.items()]
    }

from app.services.report import report_service

@router.get("/weekly_report")
async def get_weekly_report():
    # In real app: get user from auth
    user_id = 1
    report = await report_service.generate_weekly_report(user_id)
    return {"report": report}

from app.services.recommendations import recommendation_service

@router.get("/recommendations")
async def get_recommendations():
    # In real app: get user from auth
    user_id = 1
    recs = await recommendation_service.get_recommendations(user_id)
    return recs
