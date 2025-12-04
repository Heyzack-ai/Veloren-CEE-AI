"""List activities endpoint step."""
from uuid import UUID
from datetime import datetime
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.services.activity import ActivityLogger

config = {
    "name": "ListActivities",
    "type": "api",
    "path": "/api/activity",
    "method": "GET"
}

async def handler(req, context):
    """Handle list activities request."""
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
    
    user_id_str = query.get("user_id")
    entity_type = query.get("entity_type")
    entity_id_str = query.get("entity_id")
    action_types_str = query.get("action_types")
    date_from_str = query.get("date_from")
    date_to_str = query.get("date_to")
    page = int(query.get("page", 1))
    limit = int(query.get("limit", 50))
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            user_id = UUID(user_id_str) if user_id_str else None
            entity_id = UUID(entity_id_str) if entity_id_str else None
            action_types = action_types_str.split(",") if action_types_str else None
            date_from = datetime.fromisoformat(date_from_str) if date_from_str else None
            date_to = datetime.fromisoformat(date_to_str) if date_to_str else None
            
            logger = ActivityLogger(db)
            result = await logger.get_activities(
                user_id=str(user_id) if user_id else None,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else None,
                action_types=action_types,
                date_from=date_from,
                date_to=date_to,
                limit=limit,
                offset=(page - 1) * limit
            )
            
            return {
                "status": 200,
                "body": {
                    "activities": result.get("activities", []),
                    "total": result.get("total", 0),
                    "page": page,
                    "limit": limit
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing activities: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

