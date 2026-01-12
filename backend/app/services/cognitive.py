from datetime import datetime, timedelta
from typing import Dict, List, Optional
from prisma import Prisma
from prisma.models import User, UserWellbeing, StudySession, FlashcardReview, Concept
from pydantic import BaseModel

class CognitiveState(BaseModel):
    current_load: str  # HIGH, MEDIUM, LOW
    fatigue_level: int # 1-10
    sleep_debt: float
    stress_level: int
    readiness_score: int # 0-100

class CognitiveEngine:
    """
    Implements the "Brain-level" and "Mind-level" cognitive science principles.
    """
    
    def __init__(self, db: Prisma):
        self.db = db

    async def get_user_state(self, user_id: int) -> CognitiveState:
        """
        1.1 & 1.3: Retrieve Neuroscience context (Sleep, Stress, Fatigue)
        """
        # Get latest wellbeing log
        wellbeing = await self.db.userwellbeing.find_first(
            where={'userId': user_id},
            order={'date': 'desc'}
        )
        
        # Get today's sessions to calculate current fatigue
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        sessions = await self.db.studysession.find_many(
            where={
                'userId': user_id,
                'startTime': {'gte': today_start}
            }
        )
        
        # Calculate Fatigue (Simple linear model for now)
        # Each HIGH load minute = 1.5 points, MEDIUM = 1.0, LOW = 0.5
        fatigue_points = 0
        current_load = "LOW"
        
        for s in sessions:
            duration = s.duration or 0
            if s.cognitiveLoad == "HIGH":
                fatigue_points += duration * 1.5
            elif s.cognitiveLoad == "MEDIUM":
                fatigue_points += duration * 1.0
            else:
                fatigue_points += duration * 0.5
        
        # Normalize fatigue to 1-10 (assuming 4 hours high load = max fatigue)
        fatigue_level = min(10, int(fatigue_points / 24)) # 240 units = 10
        
        # Sleep & Stress defaults
        sleep_qual = wellbeing.sleepQuality if wellbeing else 7
        stress = wellbeing.stressLevel if wellbeing else 5
        
        # Readiness Score (Sleep * 5 + (10-Fatigue) * 3 + (10-Stress) * 2)
        readiness = (sleep_qual * 5) + ((10 - fatigue_level) * 3) + ((10 - stress) * 2)
        
        return CognitiveState(
            current_load="HIGH" if fatigue_level > 7 else "MEDIUM",
            fatigue_level=fatigue_level,
            sleep_debt=0.0, # Placeholder
            stress_level=stress,
            readiness_score=readiness
        )

    async def log_flashcard_review(self, flashcard_id: int, rating: int, confidence: int, actual_result: bool, duration: int):
        """
        2.3 Metacognitive Calibration: Log review with confidence data
        """
        await self.db.flashcardreview.create(
            data={
                'flashcardId': flashcard_id,
                'rating': rating,
                'confidence': confidence,
                'actualResult': actual_result,
                'duration': duration,
                'reviewedAt': datetime.now()
            }
        )

    async def get_metacognitive_insight(self, user_id: int) -> str:
        """
        Returns insight about Dunning-Kruger effect or calibration.
        """
        # Analyze last 50 reviews
        reviews = await self.db.flashcardreview.find_many(
            where={'flashcard': {'userId': user_id}},
            take=50,
            order={'reviewedAt': 'desc'},
            include={'flashcard': True}
        )
        
        if not reviews:
            return None

        overconfidence_count = 0
        underconfidence_count = 0
        
        for r in reviews:
            if not r.confidence: continue
            
            # High confidence (>=80%) but wrong (Result=False)
            if r.confidence >= 80 and not r.actualResult:
                overconfidence_count += 1
            # Low confidence (<=40%) but right (Result=True)
            elif r.confidence <= 40 and r.actualResult:
                underconfidence_count += 1
                
        if overconfidence_count > 5:
            return "⚠️ 注意：你最近有多次「以為會了但答錯」的情況。建議降低作答速度，多問自己「為什麼」。"
        
        if underconfidence_count > 5:
            return "💡 發現：你比你想像中更厲害！即使沒把握的題目也常答對。試著多相信直覺。"
            
        return "✨ 你的「自我評估」相當準確，這是學習高手的特徵！"

    async def should_trigger_break(self, user_id: int) -> bool:
        """
        1.2 Neural Fatigue: Check if user needs a break
        """
        state = await self.get_user_state(user_id)
        if state.fatigue_level >= 8:
            return True
        return False
