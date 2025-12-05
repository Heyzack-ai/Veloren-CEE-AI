"""Change password endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.core.security import verify_password, get_password_hash

config = {
    "name": "ChangePassword",
    "type": "api",
    "path": "/api/auth/password",
    "method": "PUT",
    "bodySchema": {
        "current_password": {"type": "string"},
        "new_password": {"type": "string", "minLength": 8}
    },
    "responseSchema": {
        "detail": {"type": "string"}
    }
}

async def handler(req, context):
    """Handle change password request."""
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
    
    current_password = body.get("current_password")
    new_password = body.get("new_password")
    
    if not current_password or not new_password:
        return {
            "status": 422,
            "body": {"detail": "current_password and new_password are required"}
        }
    
    if len(new_password) < 8:
        return {
            "status": 422,
            "body": {"detail": "New password must be at least 8 characters long"}
        }
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            
            # Verify current password
            if not verify_password(current_password, current_user.password_hash):
                return {
                    "status": 400,
                    "body": {"detail": "Current password is incorrect"}
                }
            
            # Update password
            current_user.password_hash = get_password_hash(new_password)
            await db.commit()
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="user.password_changed",
                    entity_type="user",
                    entity_id=str(current_user.id),
                    description=f"User {current_user.email} changed password"
                )
            except Exception:
                pass  # Continue even if activity logging fails
            
            return {
                "status": 200,
                "body": {"detail": "Password changed successfully"}
            }
        except ValueError as e:
            return {
                "status": 401,
                "body": {"detail": str(e)},
                "headers": {"WWW-Authenticate": "Bearer"}
            }
        except Exception as e:
            context.logger.error(f"Error changing password: {e}", exc_info=True)
            return {
                "status": 500,
                "body": {"detail": "Internal server error"}
            }

