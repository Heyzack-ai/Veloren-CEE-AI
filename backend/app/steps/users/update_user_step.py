"""Update user endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import User, UserRole
from app.schemas.auth import UserUpdate
from sqlalchemy import select

config = {
    "name": "UpdateUser",
    "type": "api",
    "path": "/api/users/{user_id}",
    "method": "PATCH"
}

async def handler(req, context):
    """Handle update user request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    path_params = req.get("pathParams", {})
    user_id_str = path_params.get("user_id")
    body = req.get("body", {})
    
    if not user_id_str:
        return {"status": 400, "body": {"detail": "user_id is required"}}
    
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid user_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if not user:
                return {"status": 404, "body": {"detail": "User not found"}}
            
            user_data = UserUpdate(**body)
            update_data = user_data.model_dump(exclude_unset=True)
            
            if "email" in update_data:
                email_result = await db.execute(
                    select(User).where(User.email == update_data["email"]).where(User.id != user_id)
                )
                if email_result.scalar_one_or_none():
                    return {
                        "status": 400,
                        "body": {"detail": "Email already exists"}
                    }
            
            for field, value in update_data.items():
                setattr(user, field, value)
            
            await db.commit()
            await db.refresh(user)
            
            return {
                "status": 200,
                "body": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                    "active": user.active,
                    "updated_at": user.updated_at.isoformat() if user.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating user: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

