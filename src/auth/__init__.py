"""Magic-link authentication service with JWT signed tokens."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx

from src.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.magic_link_expiry_minutes))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def verify_access_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT access token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def create_magic_link_token(email: str, user_id: Optional[uuid.UUID] = None) -> str:
    """Create a magic link token for email verification."""
    data = {
        "sub": email,
        "type": "magic_link",
        "jti": str(uuid.uuid4()),
    }
    if user_id:
        data["user_id"] = str(user_id)
    return create_access_token(data)


def decode_magic_link_token(token: str) -> Optional[dict]:
    """Decode and verify a magic link token."""
    payload = verify_access_token(token)
    if payload and payload.get("type") == "magic_link":
        return payload
    return None


async def send_magic_link_email(email: str, token: str) -> bool:
    """Send magic link email with token."""
    magic_link_url = f"{settings.frontend_url}/auth/verify?token={token}"
    
    # In production, integrate with email service (SendGrid, Resend, etc.)
    # For now, log the magic link
    print(f"MAGIC LINK for {email}: {magic_link_url}")
    
    # Simulate email sending
    return True


class AuthService:
    """Authentication service for magic-link auth."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_session_token(user_id: uuid.UUID, email: str, is_admin: bool = False) -> str:
        """Create a session token for authenticated user."""
        data = {
            "sub": str(user_id),
            "email": email,
            "type": "session",
            "is_admin": is_admin,
        }
        return create_access_token(data, expires_delta=timedelta(days=7))

    @staticmethod
    def verify_session_token(token: str) -> Optional[dict]:
        """Verify a session token."""
        payload = verify_access_token(token)
        if payload and payload.get("type") == "session":
            return payload
        return None

    @staticmethod
    async def send_login_link(email: str, user_id: Optional[uuid.UUID] = None) -> str:
        """Send a magic link to the user's email."""
        token = create_magic_link_token(email, user_id)
        await send_magic_link_email(email, token)
        return token
