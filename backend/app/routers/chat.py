from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.chat import chat_service, Message

router = APIRouter()

class ChatRequest(BaseModel):
    history: List[Message]
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/message", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest):
    # Append current message to history (conceptually, though service takes full list usually or we manage it here)
    # The blueprint implies stateless API or handling history on frontend. 
    # For a simple chat overlay, sending history from frontend is easiest.
    
    full_history = request.history + [Message(role="user", content=request.message)]
    
    reply_content = await chat_service.get_response(full_history)
    
    return {"reply": reply_content}
