from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from app.db import db
import math

router = APIRouter()

class GeneratePlanRequest(BaseModel):
    userId: int = 1
    forceRegenerate: bool = False

class GeneratedTask(BaseModel):
    title: str
    description: str
    subjectId: int
    subjectName: str
    dueDate: datetime
    priority: int
    estimatedMinutes: int
    taskType: str  # "reading", "recall", "practice", "review"

class SemesterPlanResponse(BaseModel):
    success: bool
    tasksGenerated: int
    tasks: List[GeneratedTask]
    message: str

def calculate_subject_priority(exam_date: Optional[datetime], familiarity: int) -> int:
    """Calculate priority based on exam proximity and familiarity"""
    if not exam_date:
        return 1
    
    days_until_exam = (exam_date - datetime.now()).days
    
    # More urgent if exam is soon
    urgency = 3 if days_until_exam <= 7 else (2 if days_until_exam <= 14 else 1)
    
    # Less familiar = higher priority
    familiarity_factor = 1 if familiarity > 70 else (2 if familiarity > 40 else 3)
    
    return min(3, max(1, (urgency + familiarity_factor) // 2))

def generate_learning_tasks(
    subject: dict,
    weekly_hours: int,
    exam_date: Optional[datetime],
    familiarity: int
) -> List[dict]:
    """Generate intelligent learning tasks for a subject"""
    tasks = []
    today = datetime.now()
    
    # Determine study intensity based on exam proximity
    if exam_date:
        days_until = (exam_date - today).days
        if days_until <= 7:
            intensity = "high"  # Daily review
        elif days_until <= 21:
            intensity = "medium"  # Every 2-3 days
        else:
            intensity = "normal"  # Weekly
    else:
        intensity = "normal"
    
    # Task type distribution based on familiarity
    if familiarity < 40:
        # Low familiarity: more reading and explanation
        task_types = [
            ("閱讀", "reading", 0.4),
            ("概念理解", "recall", 0.3),
            ("基礎練習", "practice", 0.2),
            ("重點複習", "review", 0.1)
        ]
    elif familiarity < 70:
        # Medium familiarity: balanced approach
        task_types = [
            ("深入閱讀", "reading", 0.2),
            ("主動回憶", "recall", 0.35),
            ("練習題", "practice", 0.3),
            ("間隔複習", "review", 0.15)
        ]
    else:
        # High familiarity: focus on practice and review
        task_types = [
            ("進階閱讀", "reading", 0.1),
            ("主動回憶", "recall", 0.25),
            ("挑戰題", "practice", 0.4),
            ("強化複習", "review", 0.25)
        ]
    
    # Calculate number of tasks based on intensity
    if intensity == "high":
        num_tasks = 7  # Daily
        interval = 1
    elif intensity == "medium":
        num_tasks = 4  # Every 2 days
        interval = 2
    else:
        num_tasks = 2  # Twice a week
        interval = 3
    
    priority = calculate_subject_priority(exam_date, familiarity)
    
    # Generate tasks
    for i in range(num_tasks):
        task_date = today + timedelta(days=i * interval)
        
        # Rotate through task types
        task_info = task_types[i % len(task_types)]
        task_name, task_type, _ = task_info
        
        # Estimate time based on task type
        if task_type == "reading":
            minutes = 30
        elif task_type == "recall":
            minutes = 20
        elif task_type == "practice":
            minutes = 45
        else:  # review
            minutes = 15
        
        tasks.append({
            "title": f"{task_name}: {subject['name']}",
            "description": f"AI自動生成的學習任務",
            "subjectId": subject["id"],
            "subjectName": subject["name"],
            "dueDate": task_date,
            "priority": priority,
            "estimatedMinutes": minutes,
            "taskType": task_type
        })
    
    return tasks

@router.post("/generate", response_model=SemesterPlanResponse)
async def generate_semester_plan(request: GeneratePlanRequest):
    """
    Generate intelligent semester study plan based on:
    - Exam dates
    - Subject familiarity
    - Available weekly hours
    - Learning science principles
    """
    try:
        # Get user's semester config
        semester_config = await db.semesterconfig.find_first(
            where={"userId": request.userId}
        )
        
        weekly_hours = semester_config.weeklyStudyHours if semester_config else 15
        
        # Get all subjects with exams
        subjects = await db.subject.find_many(
            where={"userId": request.userId},
            include={"exams": True}
        )
        
        if not subjects:
            return SemesterPlanResponse(
                success=False,
                tasksGenerated=0,
                tasks=[],
                message="沒有找到科目。請先在設定中添加科目。"
            )
        
        all_tasks = []
        
        for subject in subjects:
            # Find the nearest exam
            exams = subject.exams if hasattr(subject, 'exams') and subject.exams else []
            nearest_exam = None
            
            for exam in exams:
                if exam.examDate > datetime.now():
                    if nearest_exam is None or exam.examDate < nearest_exam:
                        nearest_exam = exam.examDate
            
            # Generate tasks for this subject
            familiarity = getattr(subject, 'familiarity', 50)
            subject_tasks = generate_learning_tasks(
                {"id": subject.id, "name": subject.name},
                weekly_hours // len(subjects),
                nearest_exam,
                familiarity
            )
            all_tasks.extend(subject_tasks)
        
        # Create tasks in database
        created_count = 0
        for task_data in all_tasks:
            await db.task.create(data={
                "title": task_data["title"],
                "description": task_data["description"],
                "subjectId": task_data["subjectId"],
                "userId": request.userId,
                "dueDate": task_data["dueDate"],
                "priority": task_data["priority"],
                "isCompleted": False
            })
            created_count += 1
        
        return SemesterPlanResponse(
            success=True,
            tasksGenerated=created_count,
            tasks=[GeneratedTask(**t) for t in all_tasks],
            message=f"成功生成 {created_count} 個學習任務！"
        )
        
    except Exception as e:
        return SemesterPlanResponse(
            success=False,
            tasksGenerated=0,
            tasks=[],
            message=f"生成計畫時發生錯誤: {str(e)}"
        )

@router.get("/preview")
async def preview_semester_plan(userId: int = 1):
    """
    Preview what the generated plan would look like without creating tasks
    """
    # Similar logic but without database writes
    subjects = await db.subject.find_many(
        where={"userId": userId},
        include={"exams": True}
    )
    
    preview_tasks = []
    
    for subject in subjects:
        exams = subject.exams if hasattr(subject, 'exams') and subject.exams else []
        nearest_exam = None
        
        for exam in exams:
            if exam.examDate > datetime.now():
                if nearest_exam is None or exam.examDate < nearest_exam:
                    nearest_exam = exam.examDate
        
        familiarity = getattr(subject, 'familiarity', 50)
        subject_tasks = generate_learning_tasks(
            {"id": subject.id, "name": subject.name},
            5,
            nearest_exam,
            familiarity
        )
        preview_tasks.extend(subject_tasks)
    
    return {
        "previewTasks": preview_tasks,
        "totalTasks": len(preview_tasks),
        "subjects": len(subjects)
    }
