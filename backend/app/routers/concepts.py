from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
from app.services.nlp import nlp_service
from app.db import db

router = APIRouter()

class ExtractRequest(BaseModel):
    text: str

class ConceptItem(BaseModel):
    text: str
    value: float

@router.get("/")
async def get_concepts(userId: int = 1):
    """Get all concepts/tags for a user based on their flashcards and sessions"""
    # Get all flashcards for user with subjects
    cards = await db.flashcard.find_many(
        where={"userId": userId},
        include={"subject": True, "tags": True}
    )
    
    # Extract concepts from flashcard fronts
    if not cards:
        return []
    
    documents = [card.front for card in cards]
    concepts = nlp_service.extract_concepts(documents)
    
    # Add subject names as concepts
    subjects = set()
    for card in cards:
        if card.subject:
            subjects.add(card.subject.name)
    
    subject_concepts = [{"text": name, "value": 1.0} for name in subjects]
    
    return concepts + subject_concepts


@router.post("/extract", response_model=List[ConceptItem])
async def extract_concepts(request: ExtractRequest):
    # Split text by newlines to treat as "documents" for TF-IDF if it's a long text, 
    # or just pass as single list if it's already structured. 
    # For now, let's treat each new line as a potential document to find commonalities.
    documents = [line for line in request.text.split('\n') if line.strip()]
    if not documents:
        # Fallback for single line text
        documents = [request.text]
        
    concepts = nlp_service.extract_concepts(documents)
    return concepts

