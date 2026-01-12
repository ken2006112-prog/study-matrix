from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
import math

from app.db import db

router = APIRouter()

# === Models ===

class ExamCreate(BaseModel):
    subjectId: int
    examType: str  # "midterm", "final", "quiz"
    examDate: datetime
    weight: int = 0
    topics: Optional[List[str]] = None
    startChapter: Optional[int] = None
    endChapter: Optional[int] = None
    textbookId: Optional[int] = None

class TextbookCreate(BaseModel):
    title: str
    subjectId: int
    totalChapters: int

class ChapterCreate(BaseModel):
    textbookId: int
    number: int
    title: str
    importance: float = 0.5  # 0-1
    estimatedHours: float = 2.0
    concepts: List[str] = []
    isCore: bool = False

class CalendarEvent(BaseModel):
    id: int
    title: str
    date: datetime
    type: str  # "exam", "study"
    subjectColor: str
    details: dict

# === Exam Endpoints ===

@router.get("/exams")
async def get_exams(subjectId: Optional[int] = None):
    """Get all exams, optionally filtered by subject"""
    where = {}
    if subjectId:
        where["subjectId"] = subjectId
    
    exams = await db.exam.find_many(
        where=where,
        include={"subject": True, "textbook": True},
        order={"examDate": "asc"}
    )
    return exams

@router.post("/exams")
async def create_exam(exam: ExamCreate):
    """Create a new exam"""
    data = {
        "subjectId": exam.subjectId,
        "examType": exam.examType,
        "examDate": exam.examDate,
        "weight": exam.weight,
        "topics": json.dumps(exam.topics) if exam.topics else None,
        "startChapter": exam.startChapter,
        "endChapter": exam.endChapter,
        "textbookId": exam.textbookId
    }
    
    created = await db.exam.create(data=data, include={"subject": True})
    return created

@router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: int):
    """Delete an exam"""
    await db.exam.delete(where={"id": exam_id})
    return {"status": "deleted"}

# === Textbook Endpoints ===

@router.get("/textbooks")
async def get_textbooks(subjectId: Optional[int] = None):
    """Get all textbooks"""
    where = {}
    if subjectId:
        where["subjectId"] = subjectId
    
    return await db.textbook.find_many(
        where=where,
        include={"chapters": True}
    )

@router.post("/textbooks")
async def create_textbook(textbook: TextbookCreate):
    """Create a textbook with default chapters"""
    created = await db.textbook.create(
        data={
            "title": textbook.title,
            "subjectId": textbook.subjectId,
            "totalChapters": textbook.totalChapters
        }
    )
    
    # Create default chapters
    for i in range(1, textbook.totalChapters + 1):
        await db.chapter.create(data={
            "textbookId": created.id,
            "number": i,
            "title": f"Chapter {i}",
            "importance": 0.5,
            "isCore": False
        })
    
    return await db.textbook.find_unique(
        where={"id": created.id},
        include={"chapters": True}
    )

@router.put("/chapters/{chapter_id}")
async def update_chapter(chapter_id: int, chapter: ChapterCreate):
    """Update chapter importance and info"""
    return await db.chapter.update(
        where={"id": chapter_id},
        data={
            "title": chapter.title,
            "importance": chapter.importance,
            "estimatedHours": chapter.estimatedHours,
            "concepts": json.dumps(chapter.concepts),
            "isCore": chapter.isCore
        }
    )

# === Study Plan Generation ===

@router.post("/generate-plan/{exam_id}")
async def generate_study_plan(exam_id: int, weeklyHours: float = 10):
    """
    Generate a weekly study plan for an exam using the 80/20 rule
    
    The plan prioritizes:
    - 20% core chapters (highest importance) for 80% of early time
    - Gradually includes support and detail chapters
    """
    exam = await db.exam.find_unique(
        where={"id": exam_id},
        include={"textbook": {"include": {"chapters": True}}, "subject": True}
    )
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Calculate weeks until exam
    now = datetime.now()
    exam_date = exam.examDate
    days_until_exam = (exam_date - now).days
    weeks_until_exam = max(1, math.ceil(days_until_exam / 7))
    
    if not exam.textbook or not exam.textbook.chapters:
        # No textbook - create generic plan
        return await _create_generic_plan(exam, weeks_until_exam, weeklyHours)
    
    # Get chapters in exam range
    chapters = exam.textbook.chapters
    if exam.startChapter and exam.endChapter:
        chapters = [c for c in chapters if exam.startChapter <= c.number <= exam.endChapter]
    
    # Sort by importance (80/20 rule)
    chapters = sorted(chapters, key=lambda c: c.importance, reverse=True)
    
    # Categorize chapters
    total = len(chapters)
    core_count = max(1, int(total * 0.2))  # Top 20%
    support_count = max(1, int(total * 0.3))  # Next 30%
    
    core_chapters = chapters[:core_count]
    support_chapters = chapters[core_count:core_count + support_count]
    detail_chapters = chapters[core_count + support_count:]
    
    # Calculate total study hours needed
    total_hours = sum(c.estimatedHours for c in chapters)
    
    # Create weekly plans
    study_plans = []
    current_week_start = now
    
    for week_num in range(1, weeks_until_exam + 1):
        week_start = current_week_start
        week_end = week_start + timedelta(days=6)
        
        # Determine priority focus for this week (80/20)
        if week_num <= weeks_until_exam * 0.4:
            # First 40% of time - focus on core (20%) chapters
            priority = "core"
            focus_chapters = core_chapters
            hours_factor = 0.5  # 50% of weekly hours for core review
        elif week_num <= weeks_until_exam * 0.7:
            # 40-70% of time - add support chapters
            priority = "support"
            focus_chapters = support_chapters
            hours_factor = 0.35
        else:
            # Last 30% - detail and review
            priority = "detail"
            focus_chapters = detail_chapters + core_chapters  # Review core
            hours_factor = 0.25
        
        # Calculate hours for this week
        week_hours = min(weeklyHours, total_hours * hours_factor / (weeks_until_exam * 0.3))
        week_hours = max(2, week_hours)  # Minimum 2 hours
        
        # Create tasks
        tasks = []
        for ch in focus_chapters[:3]:  # Max 3 chapters per week
            tasks.append({
                "chapter": ch.number,
                "title": ch.title,
                "hours": ch.estimatedHours * hours_factor,
                "isCore": ch.isCore
            })
        
        plan = await db.studyplan.create(
            data={
                "examId": exam_id,
                "weekNumber": week_num,
                "weekStart": week_start,
                "weekEnd": week_end,
                "chaptersToStudy": json.dumps([ch.id for ch in focus_chapters[:3]]),
                "totalHours": round(week_hours, 1),
                "priority": priority,
                "tasks": json.dumps(tasks)
            }
        )
        study_plans.append(plan)
        
        current_week_start = week_end + timedelta(days=1)
    
    return {
        "exam": {
            "id": exam.id,
            "subject": exam.subject.name,
            "examType": exam.examType,
            "date": exam.examDate.isoformat()
        },
        "weeksUntilExam": weeks_until_exam,
        "totalStudyHours": round(total_hours, 1),
        "chapters": {
            "core": [{"number": c.number, "title": c.title} for c in core_chapters],
            "support": [{"number": c.number, "title": c.title} for c in support_chapters],
            "detail": [{"number": c.number, "title": c.title} for c in detail_chapters]
        },
        "weeklyPlans": [
            {
                "week": p.weekNumber,
                "start": p.weekStart.isoformat(),
                "end": p.weekEnd.isoformat(),
                "priority": p.priority,
                "hours": p.totalHours,
                "tasks": json.loads(p.tasks)
            }
            for p in study_plans
        ]
    }


async def _create_generic_plan(exam, weeks: int, weekly_hours: float):
    """Create a generic study plan when no textbook is available"""
    plans = []
    now = datetime.now()
    
    for week_num in range(1, weeks + 1):
        week_start = now + timedelta(days=(week_num - 1) * 7)
        week_end = week_start + timedelta(days=6)
        
        if week_num <= weeks * 0.4:
            priority = "core"
            focus = "核心概念學習與理解"
        elif week_num <= weeks * 0.7:
            priority = "support"
            focus = "延伸應用與練習題"
        else:
            priority = "detail"
            focus = "總複習與模擬考"
        
        plan = await db.studyplan.create(
            data={
                "examId": exam.id,
                "weekNumber": week_num,
                "weekStart": week_start,
                "weekEnd": week_end,
                "chaptersToStudy": "[]",
                "totalHours": weekly_hours,
                "priority": priority,
                "tasks": json.dumps([{"task": focus, "hours": weekly_hours}])
            }
        )
        plans.append(plan)
    
    return {
        "exam": {
            "id": exam.id,
            "subject": exam.subject.name,
            "examType": exam.examType,
            "date": exam.examDate.isoformat()
        },
        "weeksUntilExam": weeks,
        "weeklyPlans": [
            {
                "week": p.weekNumber,
                "priority": p.priority,
                "hours": p.totalHours,
                "tasks": json.loads(p.tasks)
            }
            for p in plans
        ]
    }


@router.get("/plans/{exam_id}")
async def get_study_plans(exam_id: int):
    """Get study plans for an exam"""
    plans = await db.studyplan.find_many(
        where={"examId": exam_id},
        order={"weekNumber": "asc"}
    )
    
    return [
        {
            "id": p.id,
            "week": p.weekNumber,
            "start": p.weekStart.isoformat(),
            "end": p.weekEnd.isoformat(),
            "priority": p.priority,
            "hours": p.totalHours,
            "tasks": json.loads(p.tasks),
            "isCompleted": p.isCompleted
        }
        for p in plans
    ]


@router.put("/plans/{plan_id}/complete")
async def complete_plan(plan_id: int):
    """Mark a study plan week as completed"""
    await db.studyplan.update(
        where={"id": plan_id},
        data={"isCompleted": True}
    )
    return {"status": "completed"}


# === Calendar View ===

@router.get("/events")
async def get_calendar_events(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None
):
    """Get all calendar events (exams and study plans)"""
    events = []
    
    # Default to current month
    if not start:
        start = datetime.now().replace(day=1)
    if not end:
        end = (start + timedelta(days=31)).replace(day=1)
    
    # Get exams
    exams = await db.exam.find_many(
        where={
            "examDate": {
                "gte": start,
                "lte": end
            }
        },
        include={"subject": True}
    )
    
    for exam in exams:
        events.append({
            "id": f"exam-{exam.id}",
            "title": f"{exam.subject.name} {exam.examType}",
            "date": exam.examDate.isoformat(),
            "type": "exam",
            "subjectColor": exam.subject.color,
            "details": {
                "examType": exam.examType,
                "weight": exam.weight,
                "chapters": f"{exam.startChapter}-{exam.endChapter}" if exam.startChapter else None
            }
        })
    
    # Get study plans
    plans = await db.studyplan.find_many(
        where={
            "OR": [
                {"weekStart": {"gte": start, "lte": end}},
                {"weekEnd": {"gte": start, "lte": end}}
            ]
        },
        include={"exam": {"include": {"subject": True}}}
    )
    
    for plan in plans:
        events.append({
            "id": f"plan-{plan.id}",
            "title": f"Week {plan.weekNumber}: {plan.priority.title()} Focus",
            "date": plan.weekStart.isoformat(),
            "endDate": plan.weekEnd.isoformat(),
            "type": "study",
            "subjectColor": plan.exam.subject.color,
            "details": {
                "hours": plan.totalHours,
                "priority": plan.priority,
                "tasks": json.loads(plan.tasks),
                "isCompleted": plan.isCompleted
            }
        })
    
    return events
