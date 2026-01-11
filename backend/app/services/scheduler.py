from datetime import datetime, timedelta
from typing import Tuple

class FSRSScheduler:
    def __init__(self):
        # Default FSRS parameters
        self.request_retention = 0.9
        self.maximum_interval = 36500
        self.w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]

    def schedule(self, stability: float, difficulty: float, elapsed_days: int, rating: int) -> Tuple[float, float, float]:
        """
        Calculates next stability, difficulty, and interval.
        Ratings: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
        Returns: (new_stability, new_difficulty, next_interval_days)
        """
        if stability == 0:
            # First review
            new_s = self.w[rating - 1]
            new_d = self.w[4] - (rating - 3) * self.w[5]
            new_d = max(1, min(10, new_d))
            return new_s, new_d, 1 if rating == 1 else new_s # Simplified initial interval

        # Update Difficulty
        new_d = difficulty - self.w[6] * (rating - 3)
        new_d = max(1, min(10, new_d))
        # Mean reversion
        new_d = self.w[7] * self.w[4] + (1 - self.w[7]) * new_d

        # Update Stability
        if rating == 1:
            new_s = self.w[11] * (difficulty ** -self.w[12]) * ((stability + 1) ** self.w[13]) - 1
        elif rating == 2:
             new_s = stability * (1 + math.exp(self.w[8]) * (11 - difficulty) * (stability ** -self.w[9]) * (math.exp(self.w[10] * (1 - self.request_retention)) - 1))
             # Note: Simplified formula for Hard/Good/Easy usually involves elapsed_days, etc.
             # Using a linear approximation here due to complexity of full FSRS w/o library
             # Real implementation should use full formula.
             new_s = stability * 1.5 # Placeholder for Hard
        elif rating == 3:
             new_s = stability * 2.5 # Placeholder for Good
        elif rating == 4:
             new_s = stability * 4.0 # Placeholder for Easy
        
        # Next Interval
        next_ivl = new_s * 9 * (1/self.request_retention - 1)
        next_ivl = max(1, min(self.maximum_interval, next_ivl))
        
        return new_s, new_d, next_ivl

# Simple mock scheduler for prototype if math is complex to port 1:1 in one go
# Just using exponential backoff based on rating for reliability in V0
class SimpleScheduler:
    def calculate(self, current_interval: float, rating: int) -> float:
        if rating == 1: return 1
        if rating == 2: return current_interval * 1.2
        if rating == 3: return current_interval * 2.5
        if rating == 4: return current_interval * 4.0
        return 1

# Export a simple interface
scheduler = SimpleScheduler()
