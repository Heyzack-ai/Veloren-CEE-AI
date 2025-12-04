"""Dependencies for authentication and authorization (Motia compatible)."""
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import decode_access_token
from app.models.user import User, UserRole


async def get_current_user_from_token(token: str, db: AsyncSession) -> User:
    """Get the current authenticated user from a token (for Motia steps)."""
    payload = decode_access_token(token)
    if payload is None:
        raise ValueError("Could not validate credentials")
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise ValueError("Could not validate credentials")
    
    try:
        user_id: UUID = UUID(user_id_str)
    except (ValueError, TypeError):
        raise ValueError("Could not validate credentials")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise ValueError("Could not validate credentials")
    
    if not user.active:
        raise ValueError("User account is inactive")
    
    return user


async def require_role_from_user(user: User, required_roles: List[UserRole]) -> User:
    """Check if user has required role (for Motia steps)."""
    if user.role not in required_roles:
        raise ValueError(f"Requires one of: {[r.value for r in required_roles]}")
    return user



