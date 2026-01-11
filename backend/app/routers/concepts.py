from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
from app.services.nlp import nlp_service

router = APIRouter()

class ExtractRequest(BaseModel):
    text: str

class ConceptItem(BaseModel):
    text: str
    value: float

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
