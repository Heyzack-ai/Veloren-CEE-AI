"""List users endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import User, UserRole
from sqlalchemy import select

config = {
    "name": "ListUsers",
    "type": "api",
    "path": "/api/users",
    "method": "GET"
}

async def handler(req, context):
    """Handle list users request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    query = req.get("query", {})
    role_str = query.get("role")
    active_str = query.get("active")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            query_obj = select(User)
            
            if role_str:
                try:
                    role = UserRole(role_str)
                    query_obj = query_obj.where(User.role == role)
                except ValueError:
                    pass
            if active_str is not None:
                query_obj = query_obj.where(User.active == (active_str.lower() == "true"))
            
            query_obj = query_obj.order_by(User.name)
            result = await db.execute(query_obj)
            users = result.scalars().all()
            
            return {
                "status": 200,
                "body": [
                    {
                        "id": str(u.id),
                        "email": u.email,
                        "name": u.name,
                        "role": u.role.value if hasattr(u.role, "value") else str(u.role),
                        "active": u.active,
                        "created_at": u.created_at.isoformat() if u.created_at else None
                    }
                    for u in users
                ]
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing users: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

