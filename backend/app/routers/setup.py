from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.db import db

router = APIRouter(prefix="/setup", tags=["Setup Wizard"])

# --- Pydantic Models for Setup ---

class SemesterSetupRequest(BaseModel):
    userId: int # In real app, from Auth
    semesterName: str
    startDate: datetime
    endDate: datetime
    weeklyStudyHours: int
    learningStyle: Optional[str] = None

class SubjectSetupRequest(BaseModel):
    name: str
    color: str
    priority: int # 1-3
    difficulty: int # 1-10
    targetGrade: Optional[str] = None

class ExamSetupRequest(BaseModel):
    subjectName: str # Map by name since IDs might not exist yet
    examType: str # "midterm", "final"
    examDate: datetime
    weight: int

class FullSetupPayload(BaseModel):
    userId: int
    semester: SemesterSetupRequest
    subjects: List[SubjectSetupRequest]
    exams: List[ExamSetupRequest]

# --- Endpoints ---

@router.post("/initialize")
async def initialize_semester(payload: FullSetupPayload):
    """
    One-shot initialization for Semester, Subjects, and Exams.
    This acts as the final 'Submit' for the Wizard.
    """
    try:
        # 1. Create/Update Semester Config
        # Check if exists
        existing_sem = await db.semesterconfig.find_unique(where={'userId': payload.userId})
        
        sem_data = {
            'userId': payload.userId,
            'semesterName': payload.semester.semesterName,
            'startDate': payload.semester.startDate,
            'endDate': payload.semester.endDate,
            'weeklyStudyHours': payload.semester.weeklyStudyHours,
            'learningStyle': payload.semester.learningStyle
        }
        
        if existing_sem:
            semester = await db.semesterconfig.update(where={'userId': payload.userId}, data=sem_data)
        else:
            semester = await db.semesterconfig.create(data=sem_data)
            
        # 2. Create Subjects
        # We need to map subject names to IDs for Exams later
        subject_map = {} # name -> id
        
        for sub in payload.subjects:
            # Check if subject exists (by name for this user) - Optional logic, easier to just create
            # For this wizard, we assume we are setting up NEW subjects or overwriting
            
            # Simple approach: Create new
            new_sub = await db.subject.create(data={
                'name': sub.name,
                'color': sub.color,
                'userId': payload.userId,
                'priority': sub.priority,
                'difficulty': sub.difficulty,
                'targetGrade': sub.targetGrade,
                'semesterId': semester.id 
            })
            subject_map[sub.name] = new_sub.id
            
        # 3. Create Exams
        for ex in payload.exams:
            if ex.subjectName in subject_map:
                await db.exam.create(data={
                    'subjectId': subject_map[ex.subjectName],
                    'examType': ex.examType,
                    'examDate': ex.examDate,
                    'weight': ex.weight
                })
            else:
                print(f"Warning: Exam for unknown subject {ex.subjectName} skipped.")
                
        return {"status": "success", "message": "Semester initialized successfully"}

    except Exception as e:
        print(f"Setup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
