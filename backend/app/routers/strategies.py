from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.db import db

router = APIRouter()

class StrategyRecommendation(BaseModel):
    strategy: str
    description: str
    when: str
    effectiveness: float
    icon: str

# Learning strategies based on learning science
STRATEGIES = {
    "active_recall": {
        "name": "主動回憶",
        "description": "不看筆記,試著回想學過的內容",
        "when": "適合已經閱讀過一遍的概念",
        "effectiveness": 0.95,
        "icon": "🧠",
        "subjects": ["all"]
    },
    "spaced_repetition": {
        "name": "間隔複習",
        "description": "用Flashcards定期複習,間隔逐漸加長",
        "when": "需要長期記憶的知識點",
        "effectiveness": 0.90,
        "icon": "🔁",
        "subjects": ["all"]
    },
    "feynman": {
        "name": "費曼技巧",
        "description": "用自己的話解釋概念,像在教別人",
        "when": "遇到抽象或難理解的概念",
        "effectiveness": 0.88,
        "icon": "👨‍🏫",
        "subjects": ["理論性科目"]
    },
    "interleaving": {
        "name": "交錯練習",
        "description": "混合練習不同類型的題目",
        "when": "練習解題時",
        "effectiveness": 0.85,
        "icon": "🔀",
        "subjects": ["數學", "物理", "化學"]
    },
    "dual_coding": {
        "name": "雙重編碼",
        "description": "結合文字和圖像/圖表來學習",
        "when": "學習有視覺元素的內容",
        "effectiveness": 0.82,
        "icon": "🎨",
        "subjects": ["生物", "地理", "化學"]
    },
    "practice_testing": {
        "name": "練習測試",
        "description": "做練習題和模擬考",
        "when": "考試前準備",
        "effectiveness": 0.92,
        "icon": "✍️",
        "subjects": ["all"]
    },
    "elaboration": {
        "name": "精緻化",
        "description": "問為什麼,建立新舊知識的連結",
        "when": "學習新概念時",
        "effectiveness": 0.80,
        "icon": "🔗",
        "subjects": ["all"]
    },
    "chunking": {
        "name": "分塊記憶",
        "description": "把大量資訊分成小塊來記",
        "when": "需要記憶大量資訊",
        "effectiveness": 0.78,
        "icon": "📦",
        "subjects": ["all"]
    }
}

@router.get("/all")
async def get_all_strategies():
    """Get all available learning strategies"""
    return {
        "strategies": [
            {
                "id": key,
                **value
            }
            for key, value in STRATEGIES.items()
        ]
    }

@router.get("/recommend")
async def recommend_strategy(
    userId: int = 1,
    subjectId: Optional[int] = None,
    context: str = "general",
    currentTask: str = ""
):
    """Get personalized strategy recommendation"""
    
    # Get user's memory for personalization
    try:
        effective_strategies = []
        # In production, fetch from memory API
        
        # Determine context-based recommendations
        if "考試" in currentTask or "exam" in context.lower():
            recommended = ["practice_testing", "spaced_repetition", "active_recall"]
        elif "閱讀" in currentTask or "reading" in context.lower():
            recommended = ["active_recall", "feynman", "elaboration"]
        elif "練習" in currentTask or "practice" in context.lower():
            recommended = ["interleaving", "practice_testing", "chunking"]
        elif "記憶" in currentTask or "memorize" in context.lower():
            recommended = ["spaced_repetition", "chunking", "dual_coding"]
        else:
            # Default recommendations
            recommended = ["active_recall", "spaced_repetition", "feynman"]
        
        recommendations = []
        for strategy_id in recommended:
            if strategy_id in STRATEGIES:
                strategy = STRATEGIES[strategy_id]
                recommendations.append({
                    "id": strategy_id,
                    "name": strategy["name"],
                    "description": strategy["description"],
                    "when": strategy["when"],
                    "effectiveness": strategy["effectiveness"],
                    "icon": strategy["icon"]
                })
        
        # Get top recommendation with reason
        top = recommendations[0] if recommendations else None
        
        return {
            "topRecommendation": top,
            "allRecommendations": recommendations,
            "reason": f"根据你目前的任务「{currentTask or '学习'}」，{top['name'] if top else '主动回忆'}是最有效的策略",
            "context": context
        }
        
    except Exception as e:
        return {
            "topRecommendation": {
                "id": "active_recall",
                "name": "主動回憶",
                "description": "不看筆記,試著回想學過的內容",
                "effectiveness": 0.95,
                "icon": "🧠"
            },
            "allRecommendations": [],
            "reason": "主動回憶是經過科學驗證最有效的學習方法",
            "context": context
        }

@router.get("/for-subject")
async def get_strategies_for_subject(subjectName: str):
    """Get strategies optimized for a specific subject"""
    subject_lower = subjectName.lower()
    
    # Determine subject type
    if any(k in subject_lower for k in ["數學", "math", "代數", "微積分"]):
        subject_type = "數學"
        strategies = ["practice_testing", "interleaving", "active_recall"]
    elif any(k in subject_lower for k in ["物理", "physics"]):
        subject_type = "物理"
        strategies = ["practice_testing", "interleaving", "dual_coding"]
    elif any(k in subject_lower for k in ["化學", "chemistry"]):
        subject_type = "化學"
        strategies = ["dual_coding", "active_recall", "chunking"]
    elif any(k in subject_lower for k in ["生物", "biology"]):
        subject_type = "生物"
        strategies = ["dual_coding", "chunking", "spaced_repetition"]
    elif any(k in subject_lower for k in ["歷史", "history"]):
        subject_type = "歷史"
        strategies = ["chunking", "elaboration", "spaced_repetition"]
    elif any(k in subject_lower for k in ["語言", "英文", "english", "國文"]):
        subject_type = "語言"
        strategies = ["spaced_repetition", "active_recall", "elaboration"]
    else:
        subject_type = "一般"
        strategies = ["active_recall", "spaced_repetition", "feynman"]
    
    recommendations = []
    for strategy_id in strategies:
        if strategy_id in STRATEGIES:
            strategy = STRATEGIES[strategy_id]
            recommendations.append({
                "id": strategy_id,
                **strategy
            })
    
    return {
        "subjectName": subjectName,
        "subjectType": subject_type,
        "recommendedStrategies": recommendations,
        "tip": f"學習{subjectName}時，建議優先使用{recommendations[0]['name']}來提高效率"
    }

@router.post("/record-effectiveness")
async def record_strategy_effectiveness(
    userId: int = 1,
    strategyId: str = "",
    effectiveness: float = 0.5,
    context: str = ""
):
    """Record how effective a strategy was for this user"""
    # In production, save to database and update recommendations
    return {
        "success": True,
        "message": f"記錄了 {strategyId} 的效果: {effectiveness}",
        "willPersonalize": True
    }
