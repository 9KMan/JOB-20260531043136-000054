"""Compliance export router."""

import uuid
import hashlib
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import HumanReviewQueue, CreditTransaction, User
from src.schemas import ComplianceExportRequest, ComplianceExportResponse
from src.auth import AuthService

router = APIRouter(prefix="/api/export", tags=["export"])


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


def generate_checksum(data: dict) -> str:
    """Generate SHA256 checksum of data."""
    json_str = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(json_str.encode()).hexdigest()


@router.post("/compliance", response_model=ComplianceExportResponse)
async def generate_compliance_export(
    request: ComplianceExportRequest,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Generate compliance export with audit trail."""
    user = await get_current_user(token, db)
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    # Build export data
    export_data = {
        "export_type": "compliance",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": str(user.id),
        "format": request.format,
        "filters": {
            "start_date": request.start_date.isoformat() if request.start_date else None,
            "end_date": request.end_date.isoformat() if request.end_date else None,
            "rto_id": str(request.rto_id) if request.rto_id else None,
        },
        "data": {
            "human_reviews": [],
            "credit_transactions": [],
        },
    }
    
    # Query human reviews
    review_query = select(HumanReviewQueue)
    if request.start_date:
        review_query = review_query.where(HumanReviewQueue.created_at >= request.start_date)
    if request.end_date:
        review_query = review_query.where(HumanReviewQueue.created_at <= request.end_date)
    
    result = await db.execute(review_query)
    reviews = result.scalars().all()
    
    export_data["data"]["human_reviews"] = [
        {
            "id": str(r.id),
            "user_id": str(r.user_id),
            "prompt": r.prompt,
            "ai_response": r.ai_response,
            "status": r.status,
            "reviewed_by": str(r.reviewed_by) if r.reviewed_by else None,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]
    
    # Query credit transactions
    tx_query = select(CreditTransaction)
    if request.start_date:
        tx_query = tx_query.where(CreditTransaction.created_at >= request.start_date)
    if request.end_date:
        tx_query = tx_query.where(CreditTransaction.created_at <= request.end_date)
    
    result = await db.execute(tx_query)
    transactions = result.scalars().all()
    
    export_data["data"]["credit_transactions"] = [
        {
            "id": str(t.id),
            "account_id": str(t.account_id),
            "amount": t.amount,
            "reason": t.reason,
            "stripe_payment_intent": t.stripe_payment_intent,
            "created_at": t.created_at.isoformat(),
        }
        for t in transactions
    ]
    
    # Generate checksum
    checksum = generate_checksum(export_data)
    export_id = str(uuid.uuid4())
    
    return ComplianceExportResponse(
        export_id=export_id,
        format=request.format,
        data=export_data,
        generated_at=datetime.now(timezone.utc),
        checksum=checksum,
    )
