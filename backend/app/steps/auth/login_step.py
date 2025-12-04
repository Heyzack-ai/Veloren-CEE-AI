"""Login endpoint step."""
from datetime import timedelta
from app.core.database import get_session_maker
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

config = {
    "name": "Login",
    "type": "api",
    "path": "/api/auth/login",
    "method": "POST",
    "bodySchema": {
        "username": {"type": "string"},
        "password": {"type": "string"}
    }
}

async def handler(req, context):
    """Handle login request."""
    body = req.get("body", {})
    username = body.get("username")
    password = body.get("password")
    
    if not username or not password:
        return {
            "status": 422,
            "body": {"detail": "Username and password are required"}
        }
    
    # Get database session
    session_maker = get_session_maker()
    async with session_maker() as db:
        # Find user by email
        result = await db.execute(
            select(User).where(User.email == username)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.password_hash):
            return {
                "status": 401,
                "body": {
                    "detail": "Incorrect username or password"
                },
                "headers": {"WWW-Authenticate": "Bearer"}
            }
        
        if not user.active:
            return {
                "status": 403,
                "body": {"detail": "User account is inactive"}
            }
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        # Log audit (if audit service is available)
        try:
            from app.services.audit import audit_service
            await audit_service.log_action(
                db, user.id, "login", "user", user.id
            )
        except Exception:
            pass  # Continue even if audit logging fails
        
        return {
            "status": 200,
            "body": {
                "access_token": access_token,
                "token_type": "bearer"
            }
        }

