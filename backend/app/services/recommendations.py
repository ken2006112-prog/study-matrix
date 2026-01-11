from app.db import db
from datetime import datetime, timedelta
from typing import List, Dict

class RecommendationService:
    async def get_recommendations(self, user_id: int) -> List[Dict]:
        recommendations = []
        
        # 1. Check Due Flashcards (Urgent)
        due_cards = await db.flashcard.count(
            where={
                'userId': user_id, 
                'due': {'lte': datetime.now()}
            }
        )
        
        if due_cards > 10:
            recommendations.append({
                "type": "review",
                "priority": "high",
                "title": "Flashcard Pile-up!",
                "message": f"You have {due_cards} cards due. Clear them now to optimize retention.",
                "action": "Go to Flashcards",
                "link": "/flashcards"
            })
            
        # 2. Check Neglected Subjects (Balance)
        # Find subjects not studied in last 3 days
        three_days_ago = datetime.now() - timedelta(days=3)
        
        # Get all subjects
        all_subjects = await db.subject.find_many(where={'userId': user_id})
        
        for subject in all_subjects:
            # Check last session
            last_session = await db.studysession.find_first(
                where={'userId': user_id, 'subjectId': subject.id},
                order={'startTime': 'desc'}
            )
            
            if not last_session or last_session.startTime < three_days_ago:
                recommendations.append({
                    "type": "balance",
                    "priority": "medium",
                    "title": f"Reconnect with {subject.name}",
                    "message": f"It's been a while. Do a quick 15-min session to keep it fresh.",
                    "action": "Start Timer",
                    "link": "/dashboard" 
                })
                if len(recommendations) >= 3: break # Limit recommendations

        # 3. Wellbeing Check (Burnout prevention)
        # Calculate study time today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        sessions_today = await db.studysession.find_many(
            where={
                'userId': user_id,
                'startTime': {'gte': today_start}
            }
        )
        minutes_today = sum([s.duration for s in sessions_today if s.duration])
        
        if minutes_today > 240: # 4 hours
             recommendations.insert(0, { # Top priority
                "type": "wellbeing",
                "priority": "critical",
                "title": "Take a Break!",
                "message": "You've studied over 4 hours today. Diminishing returns set in. Go for a walk.",
                "action": "Rest",
                "link": "#"
            })

        # Default fallback if empty
        if not recommendations:
             recommendations.append({
                "type": "general",
                "priority": "low",
                "title": "Keep it up!",
                "message": "You're on track. Review your weekly goals.",
                "action": "View Planner",
                "link": "/planner"
            })
            
        return recommendations

recommendation_service = RecommendationService()
