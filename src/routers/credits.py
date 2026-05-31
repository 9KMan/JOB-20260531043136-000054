"""Credit management router."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import CreditAccount, CreditTransaction, User
from src.schemas import (
    CreditAccountResponse,
    CreditTransactionResponse,
    CreditPurchaseRequest,
    CreditPurchaseResponse,
    CreditBalanceResponse,
)
from src.credit_engine import CreditEngine
from src.auth import AuthService

router = APIRouter(prefix="/api/credits", tags=["credits"])


async def get_current_user(
    token: str,
    db: AsyncSession,
) -> User:
    """Get current user from token."""
    payload = AuthService.verify_session_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    user_id = uuid.UUID(payload["sub"])
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


@router.get("/", response_model=CreditBalanceResponse)
async def get_credit_balance(
    token: str,
    rto_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get current user's credit balance."""
    user = await get_current_user(token, db)
    credit_engine = CreditEngine(db)
    balance = await credit_engine.get_balance(user.id, rto_id)
    
    # Get account to return account_id
    account = await credit_engine.get_or_create_account(user.id, rto_id)
    
    return CreditBalanceResponse(balance=balance, account_id=account.id)


@router.get("/transactions", response_model=List[CreditTransactionResponse])
async def get_transactions(
    token: str,
    limit: int = 50,
    rto_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get credit transaction history."""
    user = await get_current_user(token, db)
    credit_engine = CreditEngine(db)
    transactions = await credit_engine.get_transactions(user.id, limit, rto_id)
    return transactions


@router.post("/purchase", response_model=CreditPurchaseResponse)
async def purchase_credits(
    request: CreditPurchaseRequest,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Initiate Stripe payment for credits."""
    user = await get_current_user(token, db)
    
    # In production, this would create a Stripe PaymentIntent
    # For now, return mock data
    import stripe
    
    stripe.api_key = "sk_test_placeholder"
    
    try:
        # Create PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=request.amount * 100,  # Stripe uses cents
            currency="aud",
            metadata={
                "user_id": str(user.id),
                "rto_id": str(request.rto_id) if request.rto_id else None,
                "credits": request.amount,
            },
        )
        
        return CreditPurchaseResponse(
            client_secret=payment_intent.client_secret,
            payment_intent_id=payment_intent.id,
            amount=request.amount,
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
