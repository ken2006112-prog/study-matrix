from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random

router = APIRouter()

class TutorMessage(BaseModel):
    message: str
    context: Dict[str, Any] = {}

class TutorResponse(BaseModel):
    feedback: str
    shouldFollowUp: bool = True
    conceptScore: Optional[int] = None  # 0-100 understanding score

# Feynman method feedback templates
FEEDBACK_TEMPLATES = {
    "good": [
        "很好的解釋！你抓到了核心概念。讓我補充一點：{addition}",
        "不錯！你的理解很清晰。這裡有個進階的角度：{addition}",
        "太棒了！你能用自己的話解釋，這代表真正理解了。{addition}"
    ],
    "partial": [
        "不錯的嘗試！你講對了一部分。不過還有一個重點：{addition}",
        "對的方向！讓我們再深入一點。{addition}",
        "你抓到一些要點了。還可以考慮這個角度：{addition}"
    ],
    "needs_work": [
        "沒關係，讓我們一起理清楚。這個概念的關鍵是：{addition}",
        "這是個好嘗試！讓我給你一個提示：{addition}",
        "不用擔心，很多人一開始也會混淆。重點是：{addition}"
    ]
}

CONCEPT_ADDITIONS = [
    "這個概念最重要的是理解它的基本原理，而不是死記公式。",
    "試著想一個生活中的例子來加深印象。",
    "下次遇到類似題目時，記得先回想這個核心概念。",
    "這和你之前學的其他概念有關聯，試著串連起來。",
    "考試時這類題目常常會變換情境，但核心邏輯是一樣的。"
]

FOLLOW_UP_QUESTIONS = [
    "那我再問你：這和我們學過的其他概念有什麼關係？",
    "如果換個情境，你會怎麼應用這個概念？",
    "如果要教一個初學者，你會怎麼解釋？",
    "這個概念最容易讓人混淆的地方是什麼？",
    "你覺得考試會怎麼考這個概念？"
]

def evaluate_answer(message: str, context: Dict) -> tuple[str, int]:
    """Simple heuristic to evaluate answer quality"""
    word_count = len(message)
    
    if word_count > 100:
        return "good", random.randint(75, 95)
    elif word_count > 30:
        return "partial", random.randint(50, 75)
    else:
        return "needs_work", random.randint(20, 50)

@router.post("/tutor", response_model=TutorResponse)
async def tutor_respond(request: TutorMessage):
    """
    AI Tutor endpoint that provides Feynman-method feedback
    """
    quality, score = evaluate_answer(request.message, request.context)
    
    # Select feedback template
    templates = FEEDBACK_TEMPLATES[quality]
    template = random.choice(templates)
    addition = random.choice(CONCEPT_ADDITIONS)
    feedback = template.format(addition=addition)
    
    # Determine if we should follow up
    history_length = len(request.context.get("history", []))
    should_follow_up = history_length < 6  # Max 3 Q&A pairs
    
    return TutorResponse(
        feedback=feedback,
        shouldFollowUp=should_follow_up,
        conceptScore=score
    )

@router.get("/tutor/question")
async def get_initial_question(
    subject: str = "general",
    concept: str = "",
    mode: str = "explain"
):
    """
    Get an initial Feynman-method question
    """
    questions = {
        "explain": [
            f"不看筆記，用你自己的話解釋「{concept or '這個概念'}」是什麼？",
            f"假設我是初學者，你要怎麼向我說明「{concept or '這個概念'}」？",
            f"「{concept or '這個概念'}」的核心重點是什麼？"
        ],
        "apply": [
            f"這個概念在實際情境中會怎麼用到？",
            f"如果考試這樣出題，你會怎麼解？",
            f"舉一個「{concept or '這個概念'}」的應用例子。"
        ],
        "recall": [
            f"列出「{concept or '這個概念'}」的三個最重要的要點。",
            f"這個概念和其他學過的有什麼關聯？",
            f"如果要記住這個概念，你會用什麼方法？"
        ]
    }
    
    question_list = questions.get(mode, questions["explain"])
    return {"question": random.choice(question_list)}
