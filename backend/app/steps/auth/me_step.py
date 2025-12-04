"""Get current user info endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.user import User

config = {
    "name": "GetCurrentUser",
    "type": "api",
    "path": "/api/auth/me",
    "method": "GET"
}

async def handler(req, context):
    """Handle get current user request."""
    # Extract token from Authorization header
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    
    # Get database session
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            return {
                "status": 200,
                "body": {
                    "id": str(current_user.id),
                    "email": current_user.email,
                    "name": current_user.name,
                    "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
                    "active": current_user.active
                }
            }
        except Exception as e:
            return {
                "status": 401,
                "body": {"detail": "Could not validate credentials"},
                "headers": {"WWW-Authenticate": "Bearer"}
            }

