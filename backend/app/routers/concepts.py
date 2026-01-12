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
    """Get all concepts for a user"""
    concepts = await db.concept.find_many(
        where={
            "subject": {
                "userId": userId
            }
        },
        include={"subject": True}
    )
    
    # Map to frontend interface
    result = []
    for c in concepts:
        result.append({
            "id": c.id,
            "name": c.name,
            "weight": 80, # Mock weight or calculate based on relations
            "subjectId": c.subjectId,
            "subjectName": c.subject.name if c.subject else "Unknown",
            "subjectColor": c.subject.color if c.subject else "#000000",
            "mastery": 50, # Mock mastery
            "lastReviewed": None
        })
        
    return result


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

@router.get("/graph")
async def get_concept_graph(userId: int = 1):
    """Get concept graph (nodes and edges)"""
    concepts = await db.concept.find_many(
        where={"userId": None}, # Seeded concepts might not have userId if I didn't set it? Wait, seed set userId?
        # In seed.py: c_limits = ... userId=user.id (Wait, my updated seed didn't set userId for concepts? Let me check seed content)
    )
    # Re-checking seed.py from Step 1579...
    # c_limits = await db.concept.create(..., subjectId=...) -> No userId!
    # Schema says: model Concept { ... NO userId field ... }?
    # Let's check Schema again (Step 1576).
    # Line 212: model Concept { ... subjectId Int ... tags Tag[] ... outgoing ... incoming ... }
    # NO userId in Concept model! So concepts are global? Or per subject?
    # Subjects have userId. Concepts link to Subject. So Concepts are implicitly per user via Subject.
    
    # So I need to find concepts where subject.userId == userId.
    
    concepts = await db.concept.find_many(
        where={
            "subject": {
                "userId": userId
            }
        },
        include={"outgoing": True}
    )
    
    nodes = []
    edges = []
    
    for c in concepts:
        # Determine type based on connections or simple heuristic
        c_type = "core" if len(c.outgoing) > 1 else "support"
        
        nodes.append({
            "id": str(c.id),
            "label": c.name,
            "strength": 0.8, # Mock strength or fetch from user mastery if exists
            "type": c_type
            # Frontend will handle x,y
        })
        
        for rel in c.outgoing:
            edges.append({
                "source": str(rel.sourceId),
                "target": str(rel.targetId),
                "strength": rel.strength
            })
            
    return {"nodes": nodes, "edges": edges}
