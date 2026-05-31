"""Human review queue router."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import HumanReviewQueue, User
from src.schemas import (
    HumanReviewQueueResponse,
    HumanReviewSubmitRequest,
    HumanReviewUpdateRequest,
)
from src.auth import AuthService

router = APIRouter(prefix="/api/review-queue", tags=["review-queue"])


async def get_current_user(token: str, db: AsyncSession) -> User:
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


@router.get("/", response_model=List[HumanReviewQueueResponse])
async def list_pending_reviews(
    token: str,
    status_filter: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List pending human reviews (admin only)."""
    user = await get_current_user(token, db)
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    query = select(HumanReviewQueue)
    
    if status_filter:
        query = query.where(HumanReviewQueue.status == status_filter)
    else:
        query = query.where(HumanReviewQueue.status == "pending")
    
    query = query.order_by(HumanReviewQueue.created_at.desc()).limit(limit)
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    return reviews


@router.post("/", response_model=HumanReviewQueueResponse)
async def submit_for_review(
    request: HumanReviewSubmitRequest,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Submit an AI response for human review."""
    user = await get_current_user(token, db)
    
    review = HumanReviewQueue(
        user_id=user.id,
        prompt=request.prompt,
        ai_response=request.ai_response,
        status="pending",
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    
    return review


@router.patch("/{review_id}", response_model=HumanReviewQueueResponse)
async def update_review(
    review_id: uuid.UUID,
    request: HumanReviewUpdateRequest,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Submit review (approve/escalate)."""
    user = await get_current_user(token, db)
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    query = select(HumanReviewQueue).where(HumanReviewQueue.id == review_id)
    result = await db.execute(query)
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    
    review.status = request.status
    review.reviewed_by = user.id
    
    await db.flush()
    await db.refresh(review)
    
    return review
