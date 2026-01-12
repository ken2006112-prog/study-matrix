from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

router = APIRouter()

# === Models ===
class UserMemory(BaseModel):
    userId: int
    weakConcepts: List[str] = []
    strongConcepts: List[str] = []
    preferredStrategies: List[str] = []
    bestStudyTimes: List[str] = []
    averageFocusScore: int = 70
    studyPatterns: Dict[str, Any] = {}
    commonMistakes: List[Dict[str, str]] = []
    recentProgress: List[Dict[str, Any]] = []
    learningStyle: str = "visual"
    lastUpdated: Optional[str] = None

class MemoryUpdate(BaseModel):
    type: str  # "weak_concept", "strong_concept", "mistake", "progress", "preference"
    data: Dict[str, Any]

class ErrorPattern(BaseModel):
    conceptId: int
    conceptName: str
    errorType: str  # "conceptual", "careless", "incomplete", "misconception"
    frequency: int
    lastOccurred: str
    suggestedReview: str

# === In-Memory Storage (would be DB in production) ===
USER_MEMORIES: Dict[int, UserMemory] = {}

def get_or_create_memory(userId: int) -> UserMemory:
    if userId not in USER_MEMORIES:
        USER_MEMORIES[userId] = UserMemory(
            userId=userId,
            weakConcepts=["極限", "Taylor展開", "特徵值"],
            strongConcepts=["導數基本運算", "矩陣運算"],
            preferredStrategies=["Pomodoro", "主動回憶"],
            bestStudyTimes=["20:00-22:00", "10:00-12:00"],
            averageFocusScore=75,
            studyPatterns={
                "averageSessionLength": 35,
                "preferredBreakLength": 8,
                "mostProductiveDay": "週三",
                "procrastinationTriggers": ["社群媒體", "疲勞"]
            },
            commonMistakes=[
                {"concept": "極限", "pattern": "忽略左右極限的區別", "frequency": 5},
                {"concept": "積分", "pattern": "忘記加常數C", "frequency": 3},
            ],
            recentProgress=[
                {"concept": "導數", "improvement": 15, "date": "2026-01-10"},
                {"concept": "連鎖律", "improvement": 8, "date": "2026-01-11"},
            ],
            learningStyle="visual",
            lastUpdated=datetime.now().isoformat()
        )
    return USER_MEMORIES[userId]


@router.get("/{userId}")
async def get_user_memory(userId: int):
    """
    獲取用戶的長期記憶（AI 對用戶的理解）
    """
    memory = get_or_create_memory(userId)
    return memory.model_dump()


@router.post("/{userId}/update")
async def update_user_memory(userId: int, update: MemoryUpdate):
    """
    更新用戶記憶
    """
    memory = get_or_create_memory(userId)
    
    if update.type == "weak_concept":
        concept = update.data.get("concept")
        if concept and concept not in memory.weakConcepts:
            memory.weakConcepts.append(concept)
            if concept in memory.strongConcepts:
                memory.strongConcepts.remove(concept)
    
    elif update.type == "strong_concept":
        concept = update.data.get("concept")
        if concept and concept not in memory.strongConcepts:
            memory.strongConcepts.append(concept)
            if concept in memory.weakConcepts:
                memory.weakConcepts.remove(concept)
    
    elif update.type == "mistake":
        memory.commonMistakes.append({
            "concept": update.data.get("concept", ""),
            "pattern": update.data.get("pattern", ""),
            "frequency": 1
        })
    
    elif update.type == "progress":
        memory.recentProgress.append({
            "concept": update.data.get("concept", ""),
            "improvement": update.data.get("improvement", 0),
            "date": datetime.now().strftime("%Y-%m-%d")
        })
    
    elif update.type == "preference":
        key = update.data.get("key")
        value = update.data.get("value")
        if key == "strategy":
            if value not in memory.preferredStrategies:
                memory.preferredStrategies.append(value)
        elif key == "studyTime":
            if value not in memory.bestStudyTimes:
                memory.bestStudyTimes.append(value)
        elif key == "learningStyle":
            memory.learningStyle = value
    
    memory.lastUpdated = datetime.now().isoformat()
    USER_MEMORIES[userId] = memory
    
    return {"success": True, "memory": memory.model_dump()}


@router.get("/{userId}/insights")
async def get_learning_insights(userId: int):
    """
    基於記憶生成學習洞察
    """
    memory = get_or_create_memory(userId)
    
    insights = []
    
    # 弱點分析
    if memory.weakConcepts:
        insights.append({
            "type": "weakness",
            "title": "需要加強的概念",
            "content": f"你在「{memory.weakConcepts[0]}」方面還需要多練習",
            "suggestion": "建議使用主動回憶，試著不看筆記解釋這個概念"
        })
    
    # 錯誤模式
    if memory.commonMistakes:
        most_common = max(memory.commonMistakes, key=lambda x: x.get("frequency", 0))
        insights.append({
            "type": "error_pattern",
            "title": "常見錯誤",
            "content": f"在「{most_common['concept']}」你常犯：{most_common['pattern']}",
            "suggestion": "下次遇到這類題目時特別注意"
        })
    
    # 進步追蹤
    if memory.recentProgress:
        recent = memory.recentProgress[-1]
        insights.append({
            "type": "progress",
            "title": "最近進步",
            "content": f"「{recent['concept']}」進步了 {recent['improvement']}%",
            "suggestion": "繼續保持這個學習策略！"
        })
    
    # 學習風格建議
    style_tips = {
        "visual": "多使用圖表、心智圖和概念圖",
        "auditory": "試著大聲念出來或錄音複習",
        "kinesthetic": "多做練習題和實際操作"
    }
    insights.append({
        "type": "style",
        "title": "學習風格建議",
        "content": style_tips.get(memory.learningStyle, "找到適合你的學習方式"),
        "suggestion": f"你是 {memory.learningStyle} 型學習者"
    })
    
    return {"insights": insights, "memory_summary": {
        "weakCount": len(memory.weakConcepts),
        "strongCount": len(memory.strongConcepts),
        "focusScore": memory.averageFocusScore,
        "lastUpdated": memory.lastUpdated
    }}


@router.get("/{userId}/errors")
async def get_error_analysis(userId: int):
    """
    錯題分析
    """
    memory = get_or_create_memory(userId)
    
    # 將錯誤分類
    error_patterns: List[ErrorPattern] = []
    
    for i, mistake in enumerate(memory.commonMistakes):
        error_type = "conceptual" if "概念" in mistake.get("pattern", "") or "忽略" in mistake.get("pattern", "") else "careless"
        
        error_patterns.append(ErrorPattern(
            conceptId=i + 1,
            conceptName=mistake.get("concept", ""),
            errorType=error_type,
            frequency=mistake.get("frequency", 1),
            lastOccurred="最近",
            suggestedReview="主動回憶練習" if error_type == "conceptual" else "細心檢查練習"
        ))
    
    # 統計
    conceptual_count = sum(1 for e in error_patterns if e.errorType == "conceptual")
    careless_count = sum(1 for e in error_patterns if e.errorType == "careless")
    
    return {
        "errors": [e.model_dump() for e in error_patterns],
        "summary": {
            "total": len(error_patterns),
            "conceptual": conceptual_count,
            "careless": careless_count,
            "recommendation": "專注理解核心概念" if conceptual_count > careless_count else "作答時放慢速度仔細檢查"
        }
    }
