"""Refresh token endpoint step."""
from datetime import timedelta
from app.core.database import get_session_maker
from app.core.security import decode_access_token, create_access_token
from app.core.config import settings
from app.models.user import User
from sqlalchemy import select
from uuid import UUID

config = {
    "name": "RefreshToken",
    "type": "api",
    "path": "/api/auth/refresh",
    "method": "POST",
    "bodySchema": {
        "refresh_token": {"type": "string"}
    },
    "responseSchema": {
        "access_token": {"type": "string"},
        "refresh_token": {"type": "string"},
        "token_type": {"type": "string"}
    }
}

async def handler(req, context):
    """Handle refresh token request."""
    body = req.get("body", {})
    refresh_token = body.get("refresh_token")
    
    if not refresh_token:
        return {
            "status": 422,
            "body": {"detail": "refresh_token is required"}
        }
    
    # Decode refresh token
    payload = decode_access_token(refresh_token)
    if payload is None:
        return {
            "status": 401,
            "body": {"detail": "Invalid refresh token"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        return {
            "status": 401,
            "body": {"detail": "Invalid refresh token"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    try:
        user_id = UUID(user_id_str)
    except (ValueError, TypeError):
        return {
            "status": 401,
            "body": {"detail": "Invalid refresh token"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        # Verify user exists and is active
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user or not user.active:
            return {
                "status": 401,
                "body": {"detail": "Invalid refresh token"},
                "headers": {"WWW-Authenticate": "Bearer"}
            }
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        # Optionally create new refresh token
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = create_access_token(
            data={"sub": str(user.id), "type": "refresh"}, expires_delta=refresh_token_expires
        )
        
        return {
            "status": 200,
            "body": {
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "token_type": "bearer"
            }
        }

