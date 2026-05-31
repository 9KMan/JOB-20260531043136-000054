"""SQLAlchemy models for the compliance SaaS."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.database import Base


def utcnow():
    """Return current UTC timestamp."""
    return datetime.now(timezone.utc)


class RTOOrganisation(Base):
    """RTO Organisation model."""
    __tablename__ = "rto_organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    rto_number = Column(String(50), unique=True, nullable=False)
    cricos_provider_code = Column(String(20), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    credit_accounts = relationship("CreditAccount", back_populates="rto_organisation")


class CreditAccount(Base):
    """Credit Account model."""
    __tablename__ = "credit_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    rto_id = Column(UUID(as_uuid=True), ForeignKey("rto_organisations.id"), nullable=True)
    balance = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    rto_organisation = relationship("RTOOrganisation", back_populates="credit_accounts")
    transactions = relationship("CreditTransaction", back_populates="account")


class CreditTransaction(Base):
    """Credit Transaction model."""
    __tablename__ = "credit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey("credit_accounts.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=True)
    stripe_payment_intent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    account = relationship("CreditAccount", back_populates="transactions")


class PromptTemplate(Base):
    """Prompt Template model."""
    __tablename__ = "prompt_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    is_approved = Column(Boolean, default=False)
    suggested_by = Column(UUID(as_uuid=True), nullable=True)
    approved_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    suggester = relationship("User", foreign_keys=[suggested_by], backref="suggested_prompts")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_prompts")


class HumanReviewQueue(Base):
    """Human Review Queue model."""
    __tablename__ = "human_review_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    prompt = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    status = Column(String(20), default="pending")
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    reviewer = relationship("User", foreign_keys=[reviewed_by], backref="reviews")


class StripeEvent(Base):
    """Stripe Webhook Event model for idempotency."""
    __tablename__ = "stripe_events"

    id = Column(String(255), primary_key=True)
    event_type = Column(String(100), nullable=False)
    processed_at = Column(DateTime(timezone=True), default=utcnow)


class User(Base):
    """User model for authentication and relationships."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
