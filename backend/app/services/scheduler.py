from datetime import datetime, timedelta
import math
from typing import Optional, Dict, Any, List

class FSRSScheduler:
    """
    FSRS+ Scheduler Implementation
    Based on Free Spaced Repetition Scheduler v4 logic with neuroscience-based adjustments.
    """
    
    # Default FSRS parameters (tuned on benchmarks)
    w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    
    @staticmethod
    def calculate_next_review(
        stability: float,
        difficulty: float,
        rating: int, # 1: Again, 2: Hard, 3: Good, 4: Easy
        last_review: datetime,
        sleep_quality: Optional[int] = None, # 1-10
        stress_level: Optional[int] = None # 1-10
    ) -> Dict[str, Any]:
        
        # 0. Initial values for new cards (if S=0)
        if stability == 0:
             # Basic initialization based on rating
             # Rating 1=Again(Fail), 2=Hard, 3=Good, 4=Easy
             # Map 1->w[0], 2->w[1], etc.
             stability = FSRSScheduler.w[rating - 1]
             difficulty = FSRSScheduler.w[4] - (rating - 3) * FSRSScheduler.w[5]
             difficulty = max(1, min(10, difficulty))
        else:
            # 1. Update Difficulty
            # D' = D - w6 * (grade - 3)
            # D' = w7 * D0 + (1-w7) * D'
            next_d = difficulty - FSRSScheduler.w[6] * (rating - 3)
            next_d = FSRSScheduler.w[5] * difficulty + (1 - FSRSScheduler.w[5]) * next_d
            difficulty = max(1, min(10, next_d))

            # 2. Update Stability
            # Simplified FSRS logic for S' calculation:
            # If Grade = Again (1): S' = S * w9 * e^(w10 * D) ... (Forgot)
            # If Grade > 1: S' = S * (1 + C * (G-1) * ...)
            
            if rating == 1:
                stability = FSRSScheduler.w[8] * math.pow(stability, -FSRSScheduler.w[9]) * (math.exp(FSRSScheduler.w[10] * difficulty) - 1)
            else:
                # Good/Easy/Hard curve
                # S' = S * (1 + exp(w8) * (11-D) * S^-w9 * (exp(w10*(1-R))-1)) ??
                # Using a simplified approximation for this MVP to avoid complex matrix math implementation without library
                # Using standard exponential backoff adjusted by difficulty
                
                factor = 1.0
                if rating == 2: factor = 0.8  # Hard
                if rating == 3: factor = 1.0  # Good
                if rating == 4: factor = 1.3  # Easy
                
                # Stability growth
                stability = stability * (1 + factor * (11 - difficulty) / 10)

        # 3. Apply Neuroscience Modifiers (The "+" in FSRS+)
        
        # Sleep Modifier: Poor sleep (<5) reduces consolidation efficiency
        # Good sleep (>8) boosts it
        if sleep_quality is not None:
            if sleep_quality < 5:
                stability *= 0.8
            elif sleep_quality > 8:
                stability *= 1.1

        # Stress Modifier: High stress (>7) impairs memory formation
        if stress_level is not None and stress_level > 7:
            stability *= 0.9

        # Calculate next interval
        # Interval = Stability * 9 * (1/Retention - 1)
        # Assuming target retention = 0.9
        target_retention = 0.9
        interval_days = stability * 9 * (1/target_retention - 1)
        
        # Rounding and constraints
        interval_days = max(1, interval_days)
        next_due = last_review + timedelta(days=interval_days)
        
        return {
            "stability": stability,
            "difficulty": difficulty,
            "next_due": next_due,
            "interval_days": interval_days
        }

    @staticmethod
    def get_retrievability(stability: float, elapsed_days: float) -> float:
        """
        Calculate current probability of recall (R)
        R = (1 + t / (9 * S)) ^ -1
        """
        if stability == 0: return 0.0
        return math.pow(1 + elapsed_days / (9 * stability), -1)
