from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.db import db
from app.schemas_flashcard import Flashcard, FlashcardCreate, ReviewRequest
from app.utils.fsrs import FSRSCard, Rating

router = APIRouter()

@router.post("/", response_model=Flashcard)
async def create_card(card: FlashcardCreate):
    user_id = 1
    new_card = await db.flashcard.create(
        data={
            'front': card.front,
            'back': card.back,
            'subjectId': card.subjectId,
            'userId': user_id,
        }
    )
    return new_card

@router.get("/due", response_model=List[Flashcard])
async def get_due_cards():
    """Get all cards due for review"""
    now = datetime.now()
    cards = await db.flashcard.find_many(
        where={
            'due': {'lte': now},
            'userId': 1
        },
        order={'due': 'asc'},
        include={'subject': True}
    )
    return cards

@router.get("/stats")
async def get_stats():
    """Get flashcard statistics"""
    user_id = 1
    
    total = await db.flashcard.count(where={'userId': user_id})
    due_today = await db.flashcard.count(where={
        'userId': user_id,
        'due': {'lte': datetime.now()}
    })
    
    # Get cards reviewed in last 7 days
    from datetime import timedelta
    week_ago = datetime.now() - timedelta(days=7)
    recent_reviews = await db.flashcard.find_many(
        where={
            'userId': user_id,
            'lastReview': {'gte': week_ago}
        }
    )
    
    # Calculate success rate (cards with reps > lapses)
    if recent_reviews:
        successful = sum(1 for card in recent_reviews if card.reps > card.lapses)
        success_rate = (successful / len(recent_reviews)) * 100
    else:
        success_rate = 0
    
    return {
        "total_cards": total,
        "due_today": due_today,
        "reviewed_this_week": len(recent_reviews),
        "success_rate": round(success_rate, 1)
    }

@router.post("/{card_id}/review")
async def submit_review(card_id: int, review: ReviewRequest):
    """Submit a flashcard review using FSRS algorithm"""
    card_data = await db.flashcard.find_unique(where={'id': card_id})
    if not card_data:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Create FSRS card from database data
    fsrs_card = FSRSCard(
        card_id=card_data.id,
        stability=card_data.stability,
        difficulty=card_data.difficulty,
        elapsed_days=card_data.elapsedDays,
        scheduled_days=card_data.scheduledDays,
        reps=card_data.reps,
        lapses=card_data.lapses,
        state=card_data.state,
        last_review=card_data.lastReview,
        due=card_data.due
    )
    
    # Process review with FSRS
    fsrs_card = fsrs_card.review(rating=review.rating)
    
    # Update database
    updated = await db.flashcard.update(
        where={'id': review.cardId},
        data=fsrs_card.to_dict()
    )
    
    return {
        "status": "ok",
        "next_due": fsrs_card.due,
        "interval_days": fsrs_card.scheduled_days,
        "retrievability": round(fsrs_card.get_retrievability() * 100, 1)
    }
