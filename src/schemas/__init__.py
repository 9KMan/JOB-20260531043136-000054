"""Pydantic schemas for request/response models."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# ============ Auth Schemas ============

class MagicLinkRequest(BaseModel):
    """Request to send magic link."""
    email: EmailStr


class MagicLinkResponse(BaseModel):
    """Response after magic link sent."""
    message: str
    email: EmailStr


class VerifyTokenResponse(BaseModel):
    """Response after token verification."""
    user_id: UUID
    email: EmailStr
    name: Optional[str] = None
    is_admin: bool = False
    access_token: str
    token_type: str = "bearer"


# ============ RTO Schemas ============

class RTOOrganisationBase(BaseModel):
    """Base RTO organisation schema."""
    name: str
    rto_number: str
    cricos_provider_code: Optional[str] = None
    status: str = "active"


class RTOOrganisationCreate(RTOOrganisationBase):
    """Schema for creating an RTO organisation."""
    pass


class RTOOrganisationResponse(RTOOrganisationBase):
    """Schema for RTO organisation response."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RTOLookupResponse(BaseModel):
    """Response from training.gov.au lookup."""
    rto_number: str
    name: str
    status: str
    cricos_provider_code: Optional[str] = None
    address: Optional[str] = None
    scope: Optional[str] = None


class CRICOSLookupResponse(BaseModel):
    """Response from CRICOS lookup."""
    provider_code: str
    name: str
    status: str
    courses: List[str] = []


# ============ Credit Schemas ============

class CreditAccountResponse(BaseModel):
    """Credit account response."""
    id: UUID
    user_id: UUID
    rto_id: Optional[UUID] = None
    balance: int
    created_at: datetime

    class Config:
        from_attributes = True


class CreditTransactionResponse(BaseModel):
    """Credit transaction response."""
    id: UUID
    account_id: UUID
    amount: int
    reason: Optional[str] = None
    stripe_payment_intent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CreditPurchaseRequest(BaseModel):
    """Request to purchase credits."""
    amount: int = Field(gt=0, description="Number of credits to purchase")
    rto_id: Optional[UUID] = None


class CreditPurchaseResponse(BaseModel):
    """Response after credit purchase initiation."""
    client_secret: str
    payment_intent_id: str
    amount: int


class CreditBalanceResponse(BaseModel):
    """Credit balance response."""
    balance: int
    account_id: UUID


# ============ Prompt Template Schemas ============

class PromptTemplateBase(BaseModel):
    """Base prompt template schema."""
    title: str
    body: str
    category: Optional[str] = None


class PromptTemplateCreate(PromptTemplateBase):
    """Schema for creating a prompt template."""
    pass


class PromptTemplateResponse(PromptTemplateBase):
    """Schema for prompt template response."""
    id: UUID
    is_approved: bool
    suggested_by: Optional[UUID] = None
    approved_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PromptSuggestRequest(BaseModel):
    """Request to suggest a prompt."""
    title: str
    body: str
    category: Optional[str] = None


class PromptApproveRequest(BaseModel):
    """Request to approve a prompt."""
    approved: bool


# ============ Human Review Queue Schemas ============

class HumanReviewQueueResponse(BaseModel):
    """Human review queue response."""
    id: UUID
    user_id: UUID
    prompt: str
    ai_response: str
    status: str
    reviewed_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HumanReviewSubmitRequest(BaseModel):
    """Request to submit for human review."""
    prompt: str
    ai_response: str


class HumanReviewUpdateRequest(BaseModel):
    """Request to update human review status."""
    status: str = Field(pattern="^(reviewed|escalated)$")


# ============ Stripe Webhook Schemas ============

class StripeWebhookResponse(BaseModel):
    """Stripe webhook response."""
    received: bool
    event_id: Optional[str] = None
    message: str = "Event processed successfully"


# ============ Export Schemas ============

class ComplianceExportRequest(BaseModel):
    """Request for compliance export."""
    format: str = Field(default="json", pattern="^(json|csv|pdf)$")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    rto_id: Optional[UUID] = None


class ComplianceExportResponse(BaseModel):
    """Compliance export response."""
    export_id: str
    format: str
    data: dict
    generated_at: datetime
    checksum: str
