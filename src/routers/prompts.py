"""Prompt template library router."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import PromptTemplate, User
from src.schemas import (
    PromptTemplateResponse,
    PromptTemplateCreate,
    PromptSuggestRequest,
    PromptApproveRequest,
)
from src.auth import AuthService

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


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


@router.get("/", response_model=List[PromptTemplateResponse])
async def list_prompts(
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List approved prompt templates."""
    query = select(PromptTemplate).where(PromptTemplate.is_approved == True)
    
    if category:
        query = query.where(PromptTemplate.category == category)
    
    query = query.order_by(PromptTemplate.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    prompts = result.scalars().all()
    
    return prompts


@router.get("/suggested", response_model=List[PromptTemplateResponse])
async def list_suggested_prompts(
    token: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List pending-suggested prompts (admin only)."""
    user = await get_current_user(token, db)
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    query = (
        select(PromptTemplate)
        .where(PromptTemplate.is_approved == False)
        .order_by(PromptTemplate.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    prompts = result.scalars().all()
    
    return prompts


@router.post("/suggest", response_model=PromptTemplateResponse)
async def suggest_prompt(
    request: PromptSuggestRequest,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """User suggests a new prompt template."""
    user = await get_current_user(token, db)
    
    prompt = PromptTemplate(
        title=request.title,
        body=request.body,
        category=request.category,
        is_approved=False,
        suggested_by=user.id,
    )
    db.add(prompt)
    await db.flush()
    await db.refresh(prompt)
    
    return prompt


@router.patch("/{prompt_id}/approve", response_model=PromptTemplateResponse)
async def approve_prompt(
    prompt_id: uuid.UUID,
    request: PromptApproveRequest,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Admin approves or rejects a suggested prompt."""
    user = await get_current_user(token, db)
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    query = select(PromptTemplate).where(PromptTemplate.id == prompt_id)
    result = await db.execute(query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )
    
    prompt.is_approved = request.approved
    prompt.approved_by = user.id
    
    await db.flush()
    await db.refresh(prompt)
    
    return prompt
