from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter()

# === AI Tutor Models ===
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    userId: int
    message: str
    topic: Optional[str] = "這個概念"
    mode: Optional[str] = "understanding"
    useSearch: Optional[bool] = False # New RAG toggle
    context: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    followUp: Optional[str] = None
    sources: Optional[List[str]] = None # New field for citations

class InterventionResponse(BaseModel):
    shouldIntervene: bool
    type: Optional[str] = None
    message: Optional[str] = None
    suggestion: Optional[str] = None
    action: Optional[dict] = None
    topic: Optional[str] = None
    subjectName: Optional[str] = None

# ... (Socratic prompts unchanged) ...

@router.post("/chat", response_model=ChatResponse)
async def chat_with_tutor(request: ChatRequest):
    """
    Socratic dialogue with AI tutor (Enhanced with RAG)
    """
    # 1. RAG Mode
    if request.useSearch:
        from app.services.rag import rag_service
        try:
            # Query vector DB
            docs = await rag_service.query(request.message)
            
            # Generate RAG response
            rag_response = await rag_service.get_socratic_response_with_context(
                request.message, 
                docs
            )
            
            # Extract distinct sources
            sources = list(set([d.metadata.get("source", "Unknown") for d in docs]))
            
            return ChatResponse(
                response=rag_response, 
                sources=sources,
                followUp="還有其他關於這份教材的問題嗎？"
            )
        except Exception as e:
            print(f"RAG Error: {e}")
            return ChatResponse(
                response="抱歉，搜尋筆記時發生錯誤。我將切換回普通輔導模式。",
                followUp=None
            )

    # 2. Standard Socratic Mode (Existing Logic)
    mode = request.mode or "understanding"
    topic = request.topic or "這個概念"
    
    # Get appropriate prompts for mode
    prompts = SOCRATIC_PROMPTS.get(mode, SOCRATIC_PROMPTS["understanding"])
    
    # Generate response based on context length (simulate deepening conversation)
    context_length = len(request.context)
    
    if context_length >= 6:
        # After 3 exchanges, provide summary
        response = f"""🎯 經過我們的對話，你對「{topic}」的理解已經更深入了！

總結一下你的關鍵見解：
• 你能用自己的話解釋核心概念
• 你能舉出實際應用的例子
• 你注意到了容易混淆的地方

💪 繼續保持這種主動思考的習慣！"""
        followUp = None
    else:
        # Select random follow-up question
        encouragement = random.choice(ENCOURAGEMENT_MESSAGES)
        question = random.choice(prompts).replace("{topic}", topic)
        response = f"{encouragement}\n\n{question}"
        followUp = question
    
    return ChatResponse(response=response, followUp=followUp)


@router.get("/intervention", response_model=InterventionResponse)
async def check_intervention(userId: int = Query(1)):
    """
    Check if AI should proactively intervene
    """
    # In production, this would check:
    # - Time spent on current topic
    # - Error patterns in flashcards
    # - Session duration
    # - User's historical performance
    
    # For demo, randomly suggest interventions
    if random.random() < 0.3:  # 30% chance
        interventions = [
            {
                "type": "struggle",
                "message": "我注意到你在「極限」這個概念上花了比較多時間",
                "suggestion": "要不要試試用 Feynman 方法來解釋它？",
                "action": {"label": "開始對話", "type": "chat"},
                "topic": "極限",
                "subjectName": "微積分"
            },
            {
                "type": "break",
                "message": "你已經專注學習 45 分鐘了，做得很好！",
                "suggestion": "建議休息 5-10 分鐘，讓大腦鞏固記憶",
                "action": {"label": "開始休息", "type": "break"}
            },
            {
                "type": "strategy",
                "message": "根據你的學習數據，試試交錯學習可能會更有效",
                "suggestion": "在微積分和線性代數之間切換，提升辨別能力",
                "action": {"label": "切換科目", "type": "switch"},
                "topic": "交錯學習",
                "subjectName": "學習策略"
            }
        ]
        
        intervention = random.choice(interventions)
        return InterventionResponse(
            shouldIntervene=True,
            **intervention
        )
    
    return InterventionResponse(shouldIntervene=False)


@router.get("/memory/{userId}")
async def get_user_memory(userId: int):
    """
    Get AI's memory of user preferences and patterns
    """
    # In production, this would retrieve from database
    return {
        "userId": userId,
        "weakConcepts": ["極限", "Taylor展開"],
        "strongConcepts": ["導數基本運算", "積分技巧"],
        "preferredStrategies": ["Pomodoro", "主動回憶"],
        "bestStudyTimes": ["20:00-22:00"],
        "averageFocusScore": 75,
        "commonMistakes": [
            {"concept": "極限", "pattern": "忽略左極限右極限的區別"},
            {"concept": "積分", "pattern": "忘記加常數C"}
        ],
        "recentProgress": [
            {"concept": "導數", "improvement": "+15%"},
            {"concept": "連鎖律", "improvement": "+8%"}
        ]
    }


@router.post("/memory/{userId}/update")
async def update_user_memory(userId: int, update: dict):
    """
    Update AI's memory with new observations
    """
    # In production, this would persist to database
    return {
        "success": True,
        "message": "Memory updated",
        "userId": userId
    }
