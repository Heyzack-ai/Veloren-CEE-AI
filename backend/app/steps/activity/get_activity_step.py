"""Get activity details endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.activity_log import ActivityLog
from sqlalchemy import select

config = {
    "name": "GetActivity",
    "type": "api",
    "path": "/api/activity/{activity_id}",
    "method": "GET"
}

async def handler(req, context):
    """Handle get activity request."""
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
    
    activity_id_str = path_params.get("activity_id")
    if not activity_id_str:
        return {"status": 400, "body": {"detail": "activity_id is required"}}
    
    try:
        activity_id = UUID(activity_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid activity_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get activity
            activity_result = await db.execute(select(ActivityLog).where(ActivityLog.id == activity_id))
            activity = activity_result.scalar_one_or_none()
            if not activity:
                return {"status": 404, "body": {"detail": "Activity not found"}}
            
            return {
                "status": 200,
                "body": {
                    "id": str(activity.id),
                    "user_id": str(activity.user_id) if activity.user_id else None,
                    "action_type": activity.action_type,
                    "entity_type": activity.entity_type,
                    "entity_id": str(activity.entity_id) if activity.entity_id else None,
                    "entity_reference": activity.entity_reference,
                    "description": activity.description,
                    "metadata": activity.meta_data,
                    "ip_address": str(activity.ip_address) if activity.ip_address else None,
                    "user_agent": activity.user_agent,
                    "duration_ms": activity.duration_ms,
                    "created_at": activity.created_at.isoformat() if activity.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting activity: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

