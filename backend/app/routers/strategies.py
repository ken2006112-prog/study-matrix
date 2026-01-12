from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import math

router = APIRouter()

# === Models ===
class Strategy(BaseModel):
    id: str
    name: str
    nameCn: str
    description: str
    bestFor: List[str]
    scientificBasis: str
    howTo: List[str]
    effectiveness: int  # 1-100

class StrategyRecommendation(BaseModel):
    strategy: Strategy
    relevanceScore: int  # 1-100
    reason: str
    suggestedDuration: int  # minutes

class ForgettingCurveData(BaseModel):
    conceptName: str
    initialStrength: float  # 0-1
    currentRetention: float  # 0-1
    optimalReviewTime: str
    daysUntilForget: int
    reviewsCompleted: int

# === Strategy Database ===
STRATEGIES: List[Strategy] = [
    Strategy(
        id="active_recall",
        name="Active Recall",
        nameCn="主動回憶",
        description="不看筆記，主動嘗試回想學過的內容",
        bestFor=["記憶事實", "理解概念", "準備考試"],
        scientificBasis="研究顯示，主動檢索比重讀高出 50% 的記憶保留率",
        howTo=[
            "合上書本，試著回想剛讀的內容",
            "用問題卡測試自己",
            "向他人解釋概念"
        ],
        effectiveness=95
    ),
    Strategy(
        id="spaced_repetition",
        name="Spaced Repetition",
        nameCn="間隔重複",
        description="在最佳時間點複習，對抗遺忘曲線",
        bestFor=["長期記憶", "大量詞彙", "考試準備"],
        scientificBasis="Ebbinghaus 遺忘曲線研究證實，間隔重複可將記憶保留率從 20% 提升至 80%",
        howTo=[
            "學習後 24 小時內第一次複習",
            "根據熟悉度調整下次複習時間",
            "使用 FSRS 演算法自動排程"
        ],
        effectiveness=92
    ),
    Strategy(
        id="interleaving",
        name="Interleaving",
        nameCn="交錯學習",
        description="混合不同主題或題型進行學習",
        bestFor=["解題能力", "辨別差異", "應用知識"],
        scientificBasis="研究顯示交錯練習比專一練習提升 25% 的長期表現",
        howTo=[
            "學完一個概念後切換到另一個",
            "混合不同類型的練習題",
            "在科目之間輪換"
        ],
        effectiveness=85
    ),
    Strategy(
        id="dual_coding",
        name="Dual Coding",
        nameCn="雙編碼",
        description="同時使用文字和視覺化來學習",
        bestFor=["複雜概念", "關係理解", "視覺學習者"],
        scientificBasis="Paivio 的雙編碼理論證明，圖像+文字的記憶效果是純文字的 2 倍",
        howTo=[
            "把概念畫成圖表或流程圖",
            "使用心智圖整理筆記",
            "將抽象概念視覺化"
        ],
        effectiveness=82
    ),
    Strategy(
        id="feynman",
        name="Feynman Technique",
        nameCn="費曼技巧",
        description="用簡單的話解釋複雜概念",
        bestFor=["深度理解", "發現知識漏洞", "準備教學"],
        scientificBasis="教學是最好的學習：解釋給別人聽可提升理解 90%",
        howTo=[
            "選一個概念",
            "用「教小學生」的方式解釋",
            "找出解釋不清的地方，回去重新學習"
        ],
        effectiveness=90
    ),
    Strategy(
        id="pomodoro",
        name="Pomodoro Technique",
        nameCn="番茄工作法",
        description="25 分鐘專注 + 5 分鐘休息的循環",
        bestFor=["維持專注", "對抗拖延", "時間管理"],
        scientificBasis="研究顯示結構化休息可減少 20% 認知疲勞",
        howTo=[
            "設定 25 分鐘計時器",
            "專注學習直到計時結束",
            "休息 5 分鐘後開始下一個番茄"
        ],
        effectiveness=78
    ),
    Strategy(
        id="elaboration",
        name="Elaboration",
        nameCn="精緻化",
        description="問「為什麼」和「如何」來深化理解",
        bestFor=["概念連結", "批判思考", "長期記憶"],
        scientificBasis="精緻化處理增加神經連結，提升記憶提取效率",
        howTo=[
            "讀完一段後問：為什麼是這樣？",
            "找出這個概念與已知知識的關聯",
            "舉出真實世界的例子"
        ],
        effectiveness=80
    )
]


@router.get("/all")
async def get_all_strategies():
    """
    獲取所有學習策略
    """
    return {"strategies": [s.model_dump() for s in STRATEGIES]}


@router.get("/recommend")
async def recommend_strategies(
    context: str = Query("general", description="學習情境：memory/understanding/problem_solving/focus"),
    learningStyle: str = Query("visual", description="學習風格"),
    currentChallenge: Optional[str] = Query(None, description="當前挑戰")
):
    """
    根據情境推薦學習策略
    """
    recommendations: List[StrategyRecommendation] = []
    
    context_mapping = {
        "memory": ["active_recall", "spaced_repetition"],
        "understanding": ["feynman", "dual_coding", "elaboration"],
        "problem_solving": ["interleaving", "active_recall"],
        "focus": ["pomodoro"],
        "general": ["active_recall", "spaced_repetition", "pomodoro"]
    }
    
    style_bonus = {
        "visual": ["dual_coding"],
        "auditory": ["feynman"],
        "kinesthetic": ["active_recall", "interleaving"]
    }
    
    # Get relevant strategies
    relevant_ids = context_mapping.get(context, context_mapping["general"])
    bonus_ids = style_bonus.get(learningStyle, [])
    
    for strategy in STRATEGIES:
        if strategy.id in relevant_ids:
            score = 90
            reason = f"適合 {context} 情境"
        elif strategy.id in bonus_ids:
            score = 85
            reason = f"符合你的 {learningStyle} 學習風格"
        else:
            score = 60 + (strategy.effectiveness // 10)
            reason = "通用有效策略"
        
        recommendations.append(StrategyRecommendation(
            strategy=strategy,
            relevanceScore=score,
            reason=reason,
            suggestedDuration=25 if strategy.id == "pomodoro" else 15
        ))
    
    # Sort by relevance
    recommendations.sort(key=lambda x: x.relevanceScore, reverse=True)
    
    return {
        "recommendations": [r.model_dump() for r in recommendations[:3]],
        "context": context,
        "tip": "建議從第一個策略開始嘗試"
    }


@router.get("/forgetting-curve/{userId}")
async def get_forgetting_curve_data(userId: int):
    """
    獲取遺忘曲線數據，預測最佳複習時間
    """
    # Ebbinghaus forgetting curve: R = e^(-t/S)
    # R = retention, t = time, S = stability
    
    concepts = [
        {"name": "極限", "lastReview": 2, "stability": 5, "reviews": 3},
        {"name": "導數", "lastReview": 1, "stability": 7, "reviews": 5},
        {"name": "積分", "lastReview": 4, "stability": 4, "reviews": 2},
        {"name": "連鎖律", "lastReview": 3, "stability": 6, "reviews": 4},
        {"name": "Taylor展開", "lastReview": 7, "stability": 3, "reviews": 1},
    ]
    
    results: List[ForgettingCurveData] = []
    
    for concept in concepts:
        t = concept["lastReview"]
        S = concept["stability"]
        
        # Calculate current retention
        retention = math.exp(-t / S)
        
        # Calculate days until retention drops to 50%
        days_until_forget = int(-S * math.log(0.5) - t)
        days_until_forget = max(0, days_until_forget)
        
        # Optimal review time (when retention is around 70%)
        optimal_days = int(-S * math.log(0.7))
        optimal_date = (datetime.now() + timedelta(days=max(0, optimal_days - t))).strftime("%Y-%m-%d")
        
        results.append(ForgettingCurveData(
            conceptName=concept["name"],
            initialStrength=0.95,
            currentRetention=round(retention, 2),
            optimalReviewTime=optimal_date,
            daysUntilForget=days_until_forget,
            reviewsCompleted=concept["reviews"]
        ))
    
    # Sort by urgency (lowest retention first)
    results.sort(key=lambda x: x.currentRetention)
    
    return {
        "userId": userId,
        "concepts": [r.model_dump() for r in results],
        "urgentReviews": [r.conceptName for r in results if r.currentRetention < 0.5],
        "insight": f"有 {len([r for r in results if r.currentRetention < 0.5])} 個概念需要盡快複習"
    }


@router.get("/strategy-effectiveness/{userId}")
async def get_strategy_effectiveness(userId: int):
    """
    分析用戶使用各策略的效果
    """
    # In production, would analyze actual user data
    return {
        "userId": userId,
        "effectiveness": [
            {"strategy": "主動回憶", "usageCount": 15, "retentionImprovement": 18},
            {"strategy": "間隔重複", "usageCount": 22, "retentionImprovement": 25},
            {"strategy": "番茄工作法", "usageCount": 30, "retentionImprovement": 12},
            {"strategy": "費曼技巧", "usageCount": 5, "retentionImprovement": 20},
        ],
        "recommendation": "「間隔重複」對你最有效，建議多使用",
        "underutilized": "「費曼技巧」可以嘗試更多"
    }
