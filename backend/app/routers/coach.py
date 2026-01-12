from fastapi import APIRouter
from app.services.ai_coach import ai_coach_service

router = APIRouter()

@router.get("/analysis")
async def get_comprehensive_analysis(userId: int = 1):
    """
    獲取全面的學習分析報告
    
    包含:
    - 綜合健康評分
    - 各維度指標
    - 問題識別
    - AI 個性化建議
    - 具體行動項目
    """
    return await ai_coach_service.get_comprehensive_analysis(userId)


@router.get("/quick-advice")
async def get_quick_advice(userId: int = 1):
    """
    獲取快速建議（輕量版）
    """
    analysis = await ai_coach_service.get_comprehensive_analysis(userId)
    
    return {
        "score": analysis["overview"]["health_score"],
        "top_insight": analysis["insights"][0] if analysis["insights"] else None,
        "top_action": analysis["action_items"][0] if analysis["action_items"] else None,
        "ai_tip": analysis["recommendations"].split("\n")[0] if analysis["recommendations"] else "繼續保持！"
    }
