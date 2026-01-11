from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.db import db

router = APIRouter()

class MemoryEntry(BaseModel):
    type: str  # "mistake", "strength", "strategy", "preference"
    concept: str
    subjectId: Optional[int] = None
    details: str
    confidence: float = 0.5
    lastUpdated: datetime = datetime.now()

class UserMemory(BaseModel):
    userId: int
    mistakes: List[Dict[str, Any]] = []
    strengths: List[Dict[str, Any]] = []
    effectiveStrategies: List[Dict[str, Any]] = []
    preferences: Dict[str, Any] = {}

# In-memory storage (in production, use database)
user_memories: Dict[int, UserMemory] = {}

def get_or_create_memory(user_id: int) -> UserMemory:
    if user_id not in user_memories:
        user_memories[user_id] = UserMemory(userId=user_id)
    return user_memories[user_id]

@router.post("/record-mistake")
async def record_mistake(
    userId: int = 1,
    concept: str = "",
    subjectId: Optional[int] = None,
    details: str = ""
):
    """Record a concept the user struggles with"""
    memory = get_or_create_memory(userId)
    
    # Check if mistake already exists
    existing = next((m for m in memory.mistakes if m["concept"] == concept), None)
    
    if existing:
        existing["count"] = existing.get("count", 1) + 1
        existing["lastSeen"] = datetime.now().isoformat()
        existing["details"] = details
    else:
        memory.mistakes.append({
            "concept": concept,
            "subjectId": subjectId,
            "details": details,
            "count": 1,
            "firstSeen": datetime.now().isoformat(),
            "lastSeen": datetime.now().isoformat()
        })
    
    return {"success": True, "message": f"Recorded mistake: {concept}"}

@router.post("/record-strength")
async def record_strength(
    userId: int = 1,
    concept: str = "",
    subjectId: Optional[int] = None,
    evidence: str = ""
):
    """Record a concept the user has mastered"""
    memory = get_or_create_memory(userId)
    
    memory.strengths.append({
        "concept": concept,
        "subjectId": subjectId,
        "evidence": evidence,
        "recordedAt": datetime.now().isoformat()
    })
    
    return {"success": True, "message": f"Recorded strength: {concept}"}

@router.post("/record-strategy")
async def record_strategy(
    userId: int = 1,
    strategy: str = "",
    effectiveness: float = 0.5,
    context: str = ""
):
    """Record an effective learning strategy"""
    memory = get_or_create_memory(userId)
    
    existing = next((s for s in memory.effectiveStrategies if s["strategy"] == strategy), None)
    
    if existing:
        # Update effectiveness with weighted average
        existing["effectiveness"] = (existing["effectiveness"] * 0.7) + (effectiveness * 0.3)
        existing["usageCount"] = existing.get("usageCount", 1) + 1
        existing["lastUsed"] = datetime.now().isoformat()
    else:
        memory.effectiveStrategies.append({
            "strategy": strategy,
            "effectiveness": effectiveness,
            "context": context,
            "usageCount": 1,
            "firstUsed": datetime.now().isoformat(),
            "lastUsed": datetime.now().isoformat()
        })
    
    return {"success": True, "message": f"Recorded strategy: {strategy}"}

@router.get("/get-memory")
async def get_user_memory(userId: int = 1):
    """Get all memory for a user"""
    memory = get_or_create_memory(userId)
    
    return {
        "userId": userId,
        "mistakes": memory.mistakes,
        "strengths": memory.strengths,
        "effectiveStrategies": memory.effectiveStrategies,
        "preferences": memory.preferences,
        "summary": generate_memory_summary(memory)
    }

@router.get("/get-weak-concepts")
async def get_weak_concepts(userId: int = 1, limit: int = 5):
    """Get the user's weakest concepts for focused review"""
    memory = get_or_create_memory(userId)
    
    # Sort by count (most frequent mistakes first)
    sorted_mistakes = sorted(
        memory.mistakes,
        key=lambda x: x.get("count", 0),
        reverse=True
    )
    
    return {
        "weakConcepts": sorted_mistakes[:limit],
        "recommendation": "建议优先复习这些经常出错的概念"
    }

@router.get("/get-effective-strategies")
async def get_effective_strategies(userId: int = 1):
    """Get strategies that work well for this user"""
    memory = get_or_create_memory(userId)
    
    # Sort by effectiveness
    sorted_strategies = sorted(
        memory.effectiveStrategies,
        key=lambda x: x.get("effectiveness", 0),
        reverse=True
    )
    
    return {
        "strategies": sorted_strategies,
        "topStrategy": sorted_strategies[0] if sorted_strategies else None
    }

@router.get("/personalized-prompt")
async def get_personalized_prompt(userId: int = 1, context: str = "general"):
    """Generate a personalized AI prompt based on user memory"""
    memory = get_or_create_memory(userId)
    
    prompt_parts = ["你是这位学生的专属AI助教。"]
    
    # Add mistake awareness
    if memory.mistakes:
        weak_concepts = [m["concept"] for m in memory.mistakes[:3]]
        prompt_parts.append(f"这位学生在以下概念上需要帮助：{', '.join(weak_concepts)}。")
    
    # Add strength recognition
    if memory.strengths:
        strong_concepts = [s["concept"] for s in memory.strengths[:3]]
        prompt_parts.append(f"学生已经掌握：{', '.join(strong_concepts)}。")
    
    # Add strategy preference
    if memory.effectiveStrategies:
        best_strategy = max(memory.effectiveStrategies, key=lambda x: x.get("effectiveness", 0))
        prompt_parts.append(f"对这位学生最有效的学习方式是：{best_strategy['strategy']}。")
    
    prompt_parts.append("请基于这些了解来个性化你的回答。")
    
    return {
        "personalizedPrompt": " ".join(prompt_parts),
        "context": context
    }

def generate_memory_summary(memory: UserMemory) -> str:
    """Generate a human-readable summary of user memory"""
    parts = []
    
    if memory.mistakes:
        parts.append(f"常见错误: {len(memory.mistakes)}个概念")
    
    if memory.strengths:
        parts.append(f"已掌握: {len(memory.strengths)}个概念")
    
    if memory.effectiveStrategies:
        parts.append(f"有效策略: {len(memory.effectiveStrategies)}种")
    
    return " | ".join(parts) if parts else "暂无学习记录"

@router.delete("/clear-memory")
async def clear_memory(userId: int = 1):
    """Clear all memory for a user (for testing)"""
    if userId in user_memories:
        del user_memories[userId]
    return {"success": True, "message": "Memory cleared"}
