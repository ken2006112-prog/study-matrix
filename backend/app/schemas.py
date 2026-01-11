from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    name: str
    color: str = "#000000"

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    userId: int

    class Config:
        from_attributes = True

# --- Study Session Schemas ---
class StudySessionBase(BaseModel):
    subjectId: int
    startTime: datetime
    endTime: Optional[datetime] = None
    duration: Optional[int] = None
    plannedDuration: Optional[int] = None
    isFocusMode: bool = False
    interruptions: int = 0
    notes: Optional[str] = None

class StudySessionCreate(StudySessionBase):
    pass

class StudySession(StudySessionBase):
    id: int
    userId: int


    class Config:
        from_attributes = True

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    isCompleted: bool = False
    dueDate: Optional[datetime] = None
    priority: int = 0
    subjectId: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    isCompleted: Optional[bool] = None
    dueDate: Optional[datetime] = None
    priority: Optional[int] = None
    subjectId: Optional[int] = None

class Task(TaskBase):
    id: int
    userId: int
    createdAt: datetime
    updatedAt: datetime
    subject: Optional['Subject'] = None

    class Config:
        from_attributes = True
