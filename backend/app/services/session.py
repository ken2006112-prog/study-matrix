from datetime import datetime
from typing import List, Dict, Any, Optional

class CognitiveLoadRegulator:
    """
    Regulates cognitive load based on user history and circadian rhythms.
    """

    @staticmethod
    def recommend_session_type(
        recent_sessions: List[Dict[str, Any]], # List of { 'cognitiveLoad': 'HIGH'|'MEDIUM'|'LOW', 'duration': int }
        current_hour: int = None
    ) -> Dict[str, Any]:
        """
        Recommend the next session type: FOCUS (High Load), REVIEW (Medium/Low), or REST.
        """
        if current_hour is None:
            current_hour = datetime.now().hour

        # 1. Fatigue Analysis
        # Check if last 2 sessions were HIGH load
        consecutive_high_load = 0
        for session in reversed(recent_sessions[-2:]):
            if session.get('cognitiveLoad') == 'HIGH':
                consecutive_high_load += 1
            else:
                break
        
        if consecutive_high_load >= 2:
            return {
                "type": "REST",
                "reason": "You've done 2 consecutive high-load sessions. A break is recommended to restore prefrontal cortex function.",
                "suggested_activity": "Take a 15-minute walk or do a light review."
            }
        
        # Check cumulative duration recently (e.g., > 90 mins without break)
        # Simplified for now: just load type.

        # 2. Circadian Rhythm Optimization
        # Morning (6-11): Peak alertness -> Deep Work (HIGH)
        # Afternoon (14-16): Post-lunch dip -> Review (LOW/MEDIUM)
        # Evening (19-22): Recovery/Consolidation -> Medium
        
        recommended_load = "MEDIUM"
        reason = "Balanced approach."

        if 6 <= current_hour < 11:
            recommended_load = "HIGH"
            reason = "Your cognitive alertness is likely at its peak. Good time for complex topics."
        elif 14 <= current_hour < 16:
            recommended_load = "LOW"
            reason = "Afternoon energy dip detected. Optimal for flashcard review or routine tasks."
        elif 19 <= current_hour < 23:
            recommended_load = "MEDIUM"
            reason = "Evening consolidation. Good for connecting concepts or light practice."
        
        # Conflict resolution: If circadian says HIGH but user just did HIGH, maybe downgrade to MEDIUM
        if recommended_load == "HIGH" and consecutive_high_load >= 1:
            recommended_load = "MEDIUM"
            reason = "Peak time, but pacing is important. Switching to medium load to sustain endurance."

        return {
            "type": "FOCUS" if recommended_load == "HIGH" else "REVIEW",
            "load_level": recommended_load,
            "reason": reason
        }
