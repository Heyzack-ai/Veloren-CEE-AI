"""Create user endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate
from sqlalchemy import select

config = {
    "name": "CreateUser",
    "type": "api",
    "path": "/api/users",
    "method": "POST"
}

async def handler(req, context):
    """Handle create user request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    body = req.get("body", {})
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            user_data = UserCreate(**body)
            
            result = await db.execute(select(User).where(User.email == user_data.email))
            if result.scalar_one_or_none():
                return {
                    "status": 400,
                    "body": {"detail": "Email already exists"}
                }
            
            user = User(
                email=user_data.email,
                password_hash=get_password_hash(user_data.password),
                name=user_data.name,
                role=user_data.role
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            return {
                "status": 201,
                "body": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                    "active": user.active,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error creating user: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

