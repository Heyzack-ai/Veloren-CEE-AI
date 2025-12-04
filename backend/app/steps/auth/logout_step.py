"""Logout endpoint step."""
from datetime import datetime
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.user import User
from sqlalchemy import select

config = {
    "name": "Logout",
    "type": "api",
    "path": "/api/auth/logout",
    "method": "POST"
}

async def handler(req, context):
    """Handle logout request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            
            # Update last login (optional - could also track logout time)
            current_user.last_login = datetime.utcnow()
            await db.commit()
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="user.logout",
                    entity_type="user",
                    entity_id=str(current_user.id),
                    description=f"User {current_user.email} logged out"
                )
            except Exception:
                pass  # Continue even if activity logging fails
            
            return {
                "status": 204,
                "body": None
            }
        except ValueError as e:
            return {
                "status": 401,
                "body": {"detail": str(e)},
                "headers": {"WWW-Authenticate": "Bearer"}
            }
        except Exception as e:
            context.logger.error(f"Error during logout: {e}", exc_info=True)
            return {
                "status": 500,
                "body": {"detail": "Internal server error"}
            }

