import os
from typing import Dict, Any, List, Optional
from openai import OpenAI

class SocraticCoach:
    """
    AI Coach that uses Socratic questioning to guide decision making.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def get_socratic_guidance(
        self, 
        user_state: Dict[str, Any], # e.g. { fatigue: 8, stress: 5, last_session: "HIGH" }
        options: List[Dict[str, Any]] # e.g. [{id: "A", label: "Review"}, {id: "B", label: "New"}]
    ) -> Dict[str, Any]:
        
        if not self.client:
             return {
                 "guidance": "I'm offline right now, but considering your state, option A seems safer.",
                 "recommended_option_id": options[0]['id']
             }

        system_prompt = (
            "You are a Socratic Study Coach. Your goal is to help the user make the best study decision "
            "based on their current cognitive state (fatigue, stress). "
            "Do NOT just tell them what to do. Briefly explain the trade-offs (benefits/risks) of each option "
            "and then nudge them towards the scientifically optimal choice based on cognitive load theory.\n\n"
            "Principles:\n"
            "1. High Fatigue -> Recommend Review or Rest (Low Load).\n"
            "2. High Energy -> Recommend New Material (High Load/Deep Work).\n"
            "3. Be concise and empathetic."
        )

        user_prompt = f"""
        User State: {user_state}
        Options: {options}
        
        Provide a JSON response with:
        - "guidance": A short string (max 50 words) explaining the trade-offs.
        - "recommended_option_id": The ID of the best option.
        - "reasoning": Why this option is best.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo", # or gpt-4 if available
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            # Simple parsing (assuming model follows instruction, or just returning text)
            # ideally we ask for JSON format or function calling. 
            # For robustness in MVP without function calling:
            content = response.choices[0].message.content
            # We might just return the text as guidance for now.
            
            return {
                "guidance": content,
                # We can't reliability parse ID without strict JSON mode, 
                # but let's assume the frontend displays the text.
                "recommended_option_id": None 
            }

        except Exception as e:
            print(f"Coach Error: {e}")
            return {
                "guidance": "Let's stick to the basics. How about a quick review?",
                 "recommended_option_id": options[0]['id'] if options else None
            }
