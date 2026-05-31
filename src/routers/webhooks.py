"""Stripe webhook router - idempotent webhook handling."""

import stripe
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import StripeEvent
from src.schemas import StripeWebhookResponse
from src.credit_engine import CreditEngine
from src.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/stripe", response_model=StripeWebhookResponse)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhooks idempotently."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    event_id = event["id"]

    # Check if event already processed (idempotency)
    query = select(StripeEvent).where(StripeEvent.id == event_id)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        return StripeWebhookResponse(
            received=True,
            event_id=event_id,
            message="Event already processed",
        )

    # Process event based on type
    event_type = event["type"]
    data = event["data"]["object"]

    credit_engine = CreditEngine(db)

    try:
        if event_type == "payment_intent.succeeded":
            # Credit purchase successful
            user_id = data.get("metadata", {}).get("user_id")
            amount = data.get("metadata", {}).get("credits")

            if user_id and amount:
                import uuid as uuid_module
                await credit_engine.add_credits(
                    user_id=uuid_module.UUID(user_id),
                    amount=int(amount),
                    reason="purchase",
                    stripe_payment_intent=data["id"],
                )

        elif event_type == "payment_intent.payment_failed":
            # Handle failed payment
            pass

        elif event_type == "charge.refunded":
            # Handle refund
            payment_intent_id = data.get("payment_intent")
            if payment_intent_id:
                # Find original transaction and refund
                user_id = data.get("metadata", {}).get("user_id")
                amount = int(data.get("amount", 0)) // 100

                if user_id and amount:
                    import uuid as uuid_module
                    await credit_engine.refund_credits(
                        user_id=uuid_module.UUID(user_id),
                        amount=amount,
                        stripe_payment_intent=payment_intent_id,
                    )

        # Store event for idempotency
        stripe_event = StripeEvent(id=event_id, event_type=event_type)
        db.add(stripe_event)
        await db.flush()

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing event: {str(e)}",
        )

    return StripeWebhookResponse(
        received=True,
        event_id=event_id,
        message="Event processed successfully",
    )
