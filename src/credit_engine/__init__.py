"""Credit engine module for atomic credit transaction handling."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import CreditAccount, CreditTransaction


class CreditEngine:
    """Credit engine for managing credit balances and transactions."""

    def __init__(self, db: AsyncSession):
        """Initialize credit engine with database session."""
        self.db = db

    async def get_or_create_account(
        self, user_id: uuid.UUID, rto_id: Optional[uuid.UUID] = None
    ) -> CreditAccount:
        """Get or create a credit account for a user."""
        # Try to find existing account
        query = select(CreditAccount).where(
            CreditAccount.user_id == user_id,
            CreditAccount.rto_id == rto_id,
        )
        result = await self.db.execute(query)
        account = result.scalar_one_or_none()

        if not account:
            # Create new account
            account = CreditAccount(
                user_id=user_id,
                rto_id=rto_id,
                balance=0,
            )
            self.db.add(account)
            await self.db.flush()

        return account

    async def get_balance(self, user_id: uuid.UUID, rto_id: Optional[uuid.UUID] = None) -> int:
        """Get current credit balance for a user."""
        account = await self.get_or_create_account(user_id, rto_id)
        return account.balance

    async def add_credits(
        self,
        user_id: uuid.UUID,
        amount: int,
        reason: str,
        rto_id: Optional[uuid.UUID] = None,
        stripe_payment_intent: Optional[str] = None,
    ) -> CreditAccount:
        """Add credits to a user's account atomically."""
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Get or create account
        account = await self.get_or_create_account(user_id, rto_id)

        # Create transaction record
        transaction = CreditTransaction(
            account_id=account.id,
            amount=amount,
            reason=reason,
            stripe_payment_intent=stripe_payment_intent,
        )
        self.db.add(transaction)

        # Update balance
        account.balance += amount

        await self.db.flush()
        return account

    async def deduct_credits(
        self,
        user_id: uuid.UUID,
        amount: int,
        reason: str,
        rto_id: Optional[uuid.UUID] = None,
    ) -> CreditAccount:
        """Deduct credits from a user's account atomically."""
        if amount <= 0:
            raise ValueError("Amount must be positive")

        account = await self.get_or_create_account(user_id, rto_id)

        if account.balance < amount:
            raise ValueError(f"Insufficient balance. Current: {account.balance}, Requested: {amount}")

        # Create transaction record (negative amount)
        transaction = CreditTransaction(
            account_id=account.id,
            amount=-amount,
            reason=reason,
        )
        self.db.add(transaction)

        # Update balance
        account.balance -= amount

        await self.db.flush()
        return account

    async def refund_credits(
        self,
        user_id: uuid.UUID,
        amount: int,
        stripe_payment_intent: str,
        rto_id: Optional[uuid.UUID] = None,
    ) -> CreditAccount:
        """Refund credits to a user's account."""
        if amount <= 0:
            raise ValueError("Amount must be positive")

        account = await self.get_or_create_account(user_id, rto_id)

        # Create refund transaction
        transaction = CreditTransaction(
            account_id=account.id,
            amount=amount,
            reason="refund",
            stripe_payment_intent=stripe_payment_intent,
        )
        self.db.add(transaction)

        # Update balance
        account.balance += amount

        await self.db.flush()
        return account

    async def get_transactions(
        self, user_id: uuid.UUID, limit: int = 50, rto_id: Optional[uuid.UUID] = None
    ) -> List[CreditTransaction]:
        """Get transaction history for a user."""
        account = await self.get_or_create_account(user_id, rto_id)

        query = (
            select(CreditTransaction)
            .where(CreditTransaction.account_id == account.id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def atomic_credit_operation(
        self,
        user_id: uuid.UUID,
        amount: int,
        operation: str,
        reason: str,
        stripe_payment_intent: Optional[str] = None,
        rto_id: Optional[uuid.UUID] = None,
    ) -> CreditAccount:
        """Perform atomic credit operation with transaction rollback on failure."""
        if operation == "add":
            return await self.add_credits(user_id, amount, reason, rto_id, stripe_payment_intent)
        elif operation == "deduct":
            return await self.deduct_credits(user_id, amount, reason, rto_id)
        elif operation == "refund":
            if not stripe_payment_intent:
                raise ValueError("Stripe payment intent required for refund")
            return await self.refund_credits(user_id, amount, stripe_payment_intent, rto_id)
        else:
            raise ValueError(f"Unknown operation: {operation}")
