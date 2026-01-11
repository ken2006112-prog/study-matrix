"""
FSRS-4.5 Algorithm Implementation

Free Spaced Repetition Scheduler - Optimizes flashcard review intervals
based on memory stability and difficulty.

References:
- https://github.com/open-spaced-repetition/fsrs4anki
- https://github.com/open-spaced-repetition/py-fsrs
"""

from datetime import datetime, timedelta
from typing import List, Optional
from enum import IntEnum

class Rating(IntEnum):
    """Review ratings"""
    AGAIN = 1    # Complete blackout
    HARD = 2     # Incorrect response, correct with significant difficulty
    GOOD = 3     # Correct response with some hesitation
    EASY = 4     # Perfect recall

class State(IntEnum):
    """Card states"""
    NEW = 0
    LEARNING = 1
    REVIEW = 2
    RELEARNING = 3

class FSRSParameters:
    """FSRS algorithm parameters (optimized defaults)"""
    def __init__(self):
        self.request_retention = 0.9  # Target 90% retention
        self.maximum_interval = 36500  # Max days (100 years)
        self.w = [
            0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
            0.34, 1.26, 0.29, 2.61
        ]  # Optimized weight parameters from FSRS-4.5

def calculate_stability(
    state: int,
    old_stability: float,
    difficulty: float,
    rating: int,
    params: FSRSParameters
) -> float:
    """Calculate new stability based on current state and rating"""
    w = params.w
    
    if state == State.NEW:
        # New card stability based on rating
        return w[rating - 1]
    elif state == State.REVIEW or state == State.RELEARNING:
        if rating == Rating.AGAIN:
            # Failed review - relearning
            return w[11] * (difficulty ** -w[12]) * ((old_stability + 1) ** w[13]) * (pow(2.71828, w[14] * (1 - params.request_retention)))
        else:
            # Successful review
            hard_penalty = 1 if rating == Rating.HARD else 0
            easy_bonus = 1 if rating == Rating.EASY else 0
            
            return old_stability * (
                1 + pow(2.71828, w[8]) *
                (11 - difficulty) *
                (old_stability ** -w[9]) *
                (pow(2.71828, w[10] * (1 - params.request_retention)) - 1) *
                hard_penalty +
                easy_bonus
            )
    
    return old_stability

def calculate_difficulty(
    old_difficulty: float,
    rating: int,
    params: FSRSParameters
) -> float:
    """Calculate new difficulty"""
    w = params.w
    
    # Mean reversion to initial difficulty
    mean_reversion = w[7]
    
    new_difficulty = old_difficulty - mean_reversion * (rating - 3)
    
    # Clamp between 1 and 10
    return max(1.0, min(10.0, new_difficulty))

def calculate_retrievability(
    elapsed_days: float,
    stability: float
) -> float:
    """Calculate current retrievability (probability of recall)"""
    return pow(1 + elapsed_days / (9 * stability), -1)

def calculate_interval(
    stability: float,
    request_retention: float
) -> int:
    """Calculate optimal review interval in days"""
    interval = stability * 9 * (1 / request_retention - 1)
    return max(1, round(interval))

class FSRSCard:
    """Single flashcard with FSRS state"""
    def __init__(
        self,
        card_id: int,
        stability: float = 0.0,
        difficulty: float = 5.0,
        elapsed_days: float = 0.0,
        scheduled_days: float = 0.0,
        reps: int = 0,
        lapses: int = 0,
        state: int = State.NEW,
        last_review: Optional[datetime] = None,
        due: Optional[datetime] = None
    ):
        self.card_id = card_id
        self.stability = stability
        self.difficulty = difficulty
        self.elapsed_days = elapsed_days
        self.scheduled_days = scheduled_days
        self.reps = reps
        self.lapses = lapses
        self.state = state
        self.last_review = last_review
        self.due = due or datetime.now()

    def review(
        self,
        rating: int,
        review_time: Optional[datetime] = None,
        params: Optional[FSRSParameters] = None
    ) -> 'FSRSCard':
        """
        Process a review and return updated card state
        """
        if params is None:
            params = FSRSParameters()
        
        if review_time is None:
            review_time = datetime.now()
        
        # Calculate elapsed days
        if self.last_review:
            self.elapsed_days = (review_time - self.last_review).total_seconds() / 86400
        else:
            self.elapsed_days = 0
        
        # Update state based on rating
        if self.state == State.NEW:
            if rating == Rating.AGAIN:
                self.state = State.LEARNING
            else:
                self.state = State.REVIEW
        elif self.state == State.REVIEW or self.state == State.RELEARNING:
            if rating == Rating.AGAIN:
                self.state = State.RELEARNING
                self.lapses += 1
            else:
                self.state = State.REVIEW
        
        # Calculate new parameters
        self.stability = calculate_stability(
            self.state,
            self.stability,
            self.difficulty,
            rating,
            params
        )
        
        self.difficulty = calculate_difficulty(
            self.difficulty,
            rating,
            params
        )
        
        # Calculate next interval
        if rating != Rating.AGAIN:
            self.scheduled_days = calculate_interval(
                self.stability,
                params.request_retention
            )
        else:
            # Failed review - short interval
            self.scheduled_days = 1
        
        # Update tracking
        self.reps += 1
        self.last_review = review_time
        self.due = review_time + timedelta(days=self.scheduled_days)
        
        return self

    def get_retrievability(self) -> float:
        """Get current probability of successful recall"""
        if not self.last_review:
            return 0.0
        
        elapsed = (datetime.now() - self.last_review).total_seconds() / 86400
        return calculate_retrievability(elapsed, self.stability)

    def to_dict(self) -> dict:
        """Convert to dictionary for database storage"""
        return {
            'stability': self.stability,
            'difficulty': self.difficulty,
            'elapsedDays': self.elapsed_days,
            'scheduledDays': self.scheduled_days,
            'reps': self.reps,
            'lapses': self.lapses,
            'state': self.state,
            'lastReview': self.last_review.isoformat() if self.last_review else None,
            'due': self.due.isoformat() if self.due else None
        }

# Example usage:
# card = FSRSCard(card_id=1)
# card = card.review(Rating.GOOD)
# next_review_date = card.due
# current_retention_prob = card.get_retrievability()
