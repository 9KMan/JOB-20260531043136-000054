"""Authentication router - magic-link auth endpoints."""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import User
from src.schemas import MagicLinkRequest, MagicLinkResponse, VerifyTokenResponse
from src.auth import AuthService, decode_magic_link_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/magic-link", response_model=MagicLinkResponse)
async def send_magic_link(
    request: MagicLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a magic link to the user's email."""
    # Check if user exists
    query = select(User).where(User.email == request.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    user_id = user.id if user else None

    # Send magic link
    await AuthService.send_login_link(request.email, user_id)

    return MagicLinkResponse(
        message="Magic link sent successfully",
        email=request.email,
    )


@router.get("/verify", response_model=VerifyTokenResponse)
async def verify_token(
    token: str = Query(..., description="Magic link token"),
    db: AsyncSession = Depends(get_db),
):
    """Verify magic link token and return session."""
    payload = decode_magic_link_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Find or create user
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        # Create new user
        user = User(email=email)
        db.add(user)
        await db.flush()

    # Create session token
    access_token = AuthService.create_session_token(user.id, user.email, user.is_admin)

    return VerifyTokenResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        is_admin=user.is_admin,
        access_token=access_token,
    )
