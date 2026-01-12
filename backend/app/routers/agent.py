"""
EduMate Agent API Router
統一的智能代理 API
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.agent import edumate_agent

router = APIRouter()


class AgentRequest(BaseModel):
    message: Optional[str] = None


class ActionRequest(BaseModel):
    action: str
    params: Dict[str, Any]


@router.post("/run")
async def run_agent(request: AgentRequest, userId: int = 1):
    """
    執行 Agent 完整循環
    
    Returns:
        - context_summary: 當前狀態摘要
        - health_score: 學習健康評分
        - weekly_report: 週報 (如有)
        - insights: 洞察列表
        - ai_advice: AI 建議
        - suggested_actions: 建議的操作
        - executed_actions: 已執行的操作
        - conversation_response: 對話回應
    """
    return await edumate_agent.run(userId, request.message)


@router.get("/status")
async def get_status(userId: int = 1):
    """
    快速獲取 Agent 狀態 (輕量版)
    """
    result = await edumate_agent.run(userId)
    return {
        "health_score": result["health_score"],
        "summary": result["context_summary"],
        "top_insight": result["insights"][0] if result["insights"] else None,
        "ai_tip": result["ai_advice"][:100] + "..." if len(result.get("ai_advice", "")) > 100 else result.get("ai_advice", "")
    }


@router.post("/execute")
async def execute_action(request: ActionRequest, userId: int = 1):
    """
    執行 Agent 建議的操作
    
    用戶確認後調用此 API 執行具體操作
    
    Available actions:
    - complete_task: {task_id}
    - reschedule_task: {task_id, new_date}
    - delete_task: {task_id}
    - create_task: {title, priority?, due_date?}
    - update_priority: {task_id, priority}
    """
    return await edumate_agent.execute_user_action(userId, request.action, request.params)


@router.post("/chat")
async def chat_with_agent(request: AgentRequest, userId: int = 1):
    """
    與 Agent 對話
    
    Agent 會分析數據並回應用戶問題
    """
    if not request.message:
        return {"error": "Message is required"}
    
    result = await edumate_agent.run(userId, request.message)
    return {
        "response": result["conversation_response"],
        "health_score": result["health_score"],
        "suggested_actions": result["suggested_actions"]
    }
