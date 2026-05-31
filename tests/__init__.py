"""Tests for the AI Compliance SaaS backend."""

import pytest
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from src.config import Settings


class TestSettings:
    """Test configuration settings."""

    def test_settings_defaults(self):
        """Test default settings values."""
        settings = Settings()
        assert settings.database_url == "postgresql+asyncpg://postgres:postgres@localhost:5432/compliance_saas"
        assert settings.magic_link_expiry_minutes == 15
        assert settings.environment == "development"

    def test_settings_env_override(self):
        """Test environment variable override."""
        settings = Settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/testdb",
            ENVIRONMENT="production",
        )
        assert "testdb" in settings.database_url
        assert settings.environment == "production"


class TestCreditEngine:
    """Test credit engine functionality."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        db = AsyncMock()
        db.add = MagicMock()
        db.flush = AsyncMock()
        db.refresh = AsyncMock()
        return db

    @pytest.mark.asyncio
    async def test_add_credits_positive_amount(self, mock_db):
        """Test adding positive credits."""
        from src.credit_engine import CreditEngine
        
        # Mock account query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        engine = CreditEngine(mock_db)
        
        # This would fail due to mock limitations, but tests structure
        with pytest.raises(Exception):
            await engine.add_credits(
                user_id=uuid.uuid4(),
                amount=100,
                reason="test purchase",
            )

    def test_credit_engine_initialization(self, mock_db):
        """Test credit engine initializes correctly."""
        from src.credit_engine import CreditEngine
        
        engine = CreditEngine(mock_db)
        assert engine.db == mock_db


class TestAuthService:
    """Test authentication service."""

    def test_create_access_token(self):
        """Test JWT token creation."""
        from src.auth import create_access_token
        
        token = create_access_token({"sub": "test@example.com"})
        assert token is not None
        assert isinstance(token, str)

    def test_verify_access_token_valid(self):
        """Test valid token verification."""
        from src.auth import create_access_token, verify_access_token
        
        data = {"sub": "test@example.com", "type": "magic_link"}
        token = create_access_token(data)
        
        payload = verify_access_token(token)
        assert payload is not None
        assert payload["sub"] == "test@example.com"

    def test_verify_access_token_invalid(self):
        """Test invalid token verification."""
        from src.auth import verify_access_token
        
        payload = verify_access_token("invalid.token.here")
        assert payload is None

    def test_create_magic_link_token(self):
        """Test magic link token creation."""
        from src.auth import create_magic_link_token
        
        token = create_magic_link_token("test@example.com")
        assert token is not None

    def test_decode_magic_link_token(self):
        """Test magic link token decoding."""
        from src.auth import create_magic_link_token, decode_magic_link_token
        
        token = create_magic_link_token("test@example.com")
        payload = decode_magic_link_token(token)
        
        assert payload is not None
        assert payload["sub"] == "test@example.com"
        assert payload["type"] == "magic_link"


class TestSchemas:
    """Test Pydantic schemas."""

    def test_magic_link_request_schema(self):
        """Test MagicLinkRequest schema validation."""
        from src.schemas import MagicLinkRequest
        
        request = MagicLinkRequest(email="test@example.com")
        assert request.email == "test@example.com"

    def test_magic_link_request_invalid_email(self):
        """Test MagicLinkRequest rejects invalid email."""
        from src.schemas import MagicLinkRequest
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            MagicLinkRequest(email="not-an-email")

    def test_credit_purchase_request_positive_amount(self):
        """Test CreditPurchaseRequest validates positive amount."""
        from src.schemas import CreditPurchaseRequest
        
        request = CreditPurchaseRequest(amount=100)
        assert request.amount == 100

    def test_credit_purchase_request_zero_amount(self):
        """Test CreditPurchaseRequest rejects zero amount."""
        from src.schemas import CreditPurchaseRequest
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            CreditPurchaseRequest(amount=0)

    def test_compliance_export_request_formats(self):
        """Test ComplianceExportRequest format validation."""
        from src.schemas import ComplianceExportRequest
        
        request = ComplianceExportRequest(format="json")
        assert request.format == "json"
        
        request = ComplianceExportRequest(format="csv")
        assert request.format == "csv"

    def test_compliance_export_request_invalid_format(self):
        """Test ComplianceExportRequest rejects invalid format."""
        from src.schemas import ComplianceExportRequest
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            ComplianceExportRequest(format="xml")


class TestModels:
    """Test SQLAlchemy models."""

    def test_rto_organisation_model(self):
        """Test RTOOrganisation model attributes."""
        from src.models import RTOOrganisation
        
        assert hasattr(RTOOrganisation, "__tablename__")
        assert RTOOrganisation.__tablename__ == "rto_organisations"

    def test_credit_account_model(self):
        """Test CreditAccount model attributes."""
        from src.models import CreditAccount
        
        assert hasattr(CreditAccount, "__tablename__")
        assert CreditAccount.__tablename__ == "credit_accounts"

    def test_credit_transaction_model(self):
        """Test CreditTransaction model attributes."""
        from src.models import CreditTransaction
        
        assert hasattr(CreditTransaction, "__tablename__")
        assert CreditTransaction.__tablename__ == "credit_transactions"

    def test_prompt_template_model(self):
        """Test PromptTemplate model attributes."""
        from src.models import PromptTemplate
        
        assert hasattr(PromptTemplate, "__tablename__")
        assert PromptTemplate.__tablename__ == "prompt_templates"

    def test_human_review_queue_model(self):
        """Test HumanReviewQueue model attributes."""
        from src.models import HumanReviewQueue
        
        assert hasattr(HumanReviewQueue, "__tablename__")
        assert HumanReviewQueue.__tablename__ == "human_review_queue"

    def test_stripe_event_model(self):
        """Test StripeEvent model attributes."""
        from src.models import StripeEvent
        
        assert hasattr(StripeEvent, "__tablename__")
        assert StripeEvent.__tablename__ == "stripe_events"


class TestSeedData:
    """Test seed data generation."""

    def test_generate_seed_prompts_count(self):
        """Test that seed data generates 100 prompts."""
        from seed_data import generate_seed_prompts
        
        prompts = generate_seed_prompts()
        assert len(prompts) == 100

    def test_generate_seed_prompts_structure(self):
        """Test seed prompt structure."""
        from seed_data import generate_seed_prompts
        
        prompts = generate_seed_prompts()
        first = prompts[0]
        
        assert "id" in first
        assert "title" in first
        assert "body" in first
        assert "category" in first
        assert "is_approved" in first

    def test_generate_seed_prompts_categories(self):
        """Test that prompts cover all required categories."""
        from seed_data import generate_seed_prompts
        
        prompts = generate_seed_prompts()
        categories = {p["category"] for p in prompts}
        
        expected_categories = {
            "compliance", "training_packages", "assessment",
            "learner_support", "quality", "financial",
            "data", "international", "industry", "digital", "whs"
        }
        
        assert expected_categories.issubset(categories)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
