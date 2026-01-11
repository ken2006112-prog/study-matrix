from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FlashcardBase(BaseModel):
    front: str
    back: str
    subjectId: int

class FlashcardCreate(FlashcardBase):
    pass

class Flashcard(FlashcardBase):
    id: int
    userId: int
    # State fields
    state: int
    due: datetime
    
    class Config:
        from_attributes = True

class ReviewRequest(BaseModel):
    cardId: int
    rating: int # 1, 2, 3, 4
