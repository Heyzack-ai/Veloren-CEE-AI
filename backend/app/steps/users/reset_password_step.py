"""Reset user password endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from sqlalchemy import select

config = {
    "name": "ResetUserPassword",
    "type": "api",
    "path": "/api/users/{user_id}/reset-password",
    "method": "POST"
}

async def handler(req, context):
    """Handle reset user password request."""
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
    new_password = body.get("new_password")
    
    if not user_id_str:
        return {"status": 400, "body": {"detail": "user_id is required"}}
    if not new_password:
        return {"status": 400, "body": {"detail": "new_password is required"}}
    
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
            
            user.password_hash = get_password_hash(new_password)
            await db.commit()
            
            return {
                "status": 200,
                "body": {"message": "Password reset"}
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error resetting password: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

