from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from app.routers.auth import get_current_user
import os

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

# Stripe Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Mock Stripe for development if no key
import stripe
stripe.api_key = STRIPE_SECRET_KEY

class CreateCheckoutRequest(BaseModel):
    planId: str # "price_pro_monthly", "price_team_monthly"

@router.post("/create-checkout-session")
async def create_checkout_session(req: CreateCheckoutRequest, user = Depends(get_current_user)):
    """
    Create a Stripe Checkout Session for subscription
    """
    if STRIPE_SECRET_KEY == "sk_test_placeholder":
         # Return a mock URL for testing without real Stripe
         return {"url": f"{FRONTEND_URL}/settings?status=success&session_id=mock_session_123"}

    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=user.email,
            line_items=[
                {
                    'price': req.planId,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=FRONTEND_URL + '/settings?status=success&session_id={CHECKOUT_SESSION_ID}',
            cancel_url=FRONTEND_URL + '/settings?status=canceled',
            metadata={
                'userId': user.id
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe Webhooks (subscription updated/deleted)
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if STRIPE_SECRET_KEY == "sk_test_placeholder":
        return {"status": "ignored_mock"}

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET", "")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        # TODO: Update user subscription status in DB
        print(f"Payment successful for session {session['id']}")
        
    return {"status": "success"}
