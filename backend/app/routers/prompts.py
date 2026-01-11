from fastapi import APIRouter
from typing import Optional
from app.services.prompts import (
    get_prompt, 
    get_understanding_prompt,
    get_priority_prompt,
    get_reflection_prompt,
    get_motivation_prompt,
    PromptCategory,
    ALL_PROMPTS
)

router = APIRouter()

@router.get("/understanding")
async def get_understanding_question(concept: str = "這個概念"):
    """Get a Socratic understanding prompt for a concept"""
    return get_understanding_prompt(concept)

@router.get("/priority")
async def get_priority_question(hours: float = 2, days_to_exam: int = 7):
    """Get a priority decision prompt"""
    return get_priority_prompt(hours, days_to_exam)

@router.get("/reflection")
async def get_reflection_question(minutes: int = 30):
    """Get a reflection prompt after study session"""
    return get_reflection_prompt(minutes)

@router.get("/motivation")
async def get_motivation_question(
    streak_days: int = 1,
    subject: str = "這科",
    improvement_percent: int = 10,
    time_of_day: str = "晚上"
):
    """Get a motivation prompt"""
    return get_motivation_prompt(streak_days, subject, improvement_percent, time_of_day)

@router.get("/random")
async def get_random_prompt(category: Optional[str] = None):
    """Get a random prompt from any or specified category"""
    if category:
        try:
            cat = PromptCategory(category)
            return get_prompt(cat)
        except ValueError:
            pass
    
    # Random from all categories
    import random
    cat = random.choice(list(PromptCategory))
    return get_prompt(cat)

@router.get("/categories")
async def list_categories():
    """List all prompt categories"""
    return {
        "categories": [
            {
                "id": cat.value,
                "name": {
                    "understanding": "理解確認",
                    "priority": "優先級決策",
                    "strategy": "策略選擇",
                    "reflection": "學習反思",
                    "planning": "計畫調整",
                    "motivation": "動機激發"
                }.get(cat.value, cat.value),
                "count": len(ALL_PROMPTS[cat])
            }
            for cat in PromptCategory
        ]
    }

@router.get("/all")
async def get_all_prompts():
    """Get all prompts organized by category"""
    return {
        category.value: [
            {
                "template": p["template"],
                "purpose": p.get("purpose", "")
            }
            for p in prompts
        ]
        for category, prompts in ALL_PROMPTS.items()
    }
