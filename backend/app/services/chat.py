import os
import random
import asyncio
from typing import List, Dict, Optional
from pydantic import BaseModel

# Try to import OpenAI, but don't fail if not installed yet (though we are installing it)
try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

class Message(BaseModel):
    role: str # "user", "assistant", "system"
    content: str

class ChatService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key and AsyncOpenAI:
            self.client = AsyncOpenAI(api_key=self.api_key)
        
        # System prompt for Socratic Tutor
        self.system_prompt = """You are EduMate, a Socratic Study Assistant.
        Your goal is to guide the user to the answer, NOT to give the answer directly.
        Ask probing questions. Challenge assumptions.
        If the user asks for a plan, ask about their constraints first.
        Be concise, encouraging, and analytical.
        """

    async def get_response(self, history: List[Message]) -> str:
        """
        Generates a response based on conversation history.
        Uses OpenAI if available, otherwise falls back to Socratic Mock.
        """
        if self.client:
            try:
                # Prepare messages
                messages = [{"role": "system", "content": self.system_prompt}]
                for msg in history:
                    messages.append(msg.dict())
                
                response = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo", # Or gpt-4 if available/preferred
                    messages=messages,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API Error: {e}")
                # Fallback to mock on error
                return self._mock_socratic_response(history)
        else:
            return self._mock_socratic_response(history)

    async def generate_completion(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generates a single completion for a given prompt (non-chat).
        """
        sys_prompt = system_prompt or "You are a helpful AI assistant."
        
        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API Error: {e}")
                return self._mock_completion_response(prompt)
        else:
             return self._mock_completion_response(prompt)

    def _mock_completion_response(self, prompt: str) -> str:
        """
        Mock response for reports/analysis.
        """
        return """
# Weekly Insight (Mock)

**Summary**: Great job this week! You maintained high consistency in *Mathematics*.
**Time Honesty**: You hit **85%** of your planned goals. This is a strong result!
**Suggestion**: Try to increase your detailed study blocks next week.
        """

    def _mock_socratic_response(self, history: List[Message]) -> str:
        """
        Simulates a Socratic tutor for dev/demo purposes without API costs.
        """
        last_user_msg = history[-1].content.lower() if history else ""
        
        # Simple keyword-based logic to simulate "intelligence"
        if "plan" in last_user_msg:
             return "To build the best plan for you, I need to know: When is your most important exam, and how many hours can you study daily?"
        
        if "explain" in last_user_msg or "what is" in last_user_msg:
             return "That's a great question. Before I define it, what is your current understanding of this concept? Try to explain it in your own words first."
        
        if "tired" in last_user_msg or "burnout" in last_user_msg:
             return "It sounds like you've been working hard. Sustainability is key. Have you taken a break recently, or should we switch to a lighter task like reviewing flashcards?"
             
        if "solve" in last_user_msg or "problem" in last_user_msg:
             return "Let's break this down. What is the first step you think we should take to solve this problem?"

        # Default encouragement / probing
        responses = [
            "Interesting. How does this connect to what we studied yesterday?",
            "Can you elaborate on that?",
            "What do you think is the most critical part of this topic?",
            "Let's go deeper. Why do you think that is the case?"
        ]
        return random.choice(responses)

chat_service = ChatService()
