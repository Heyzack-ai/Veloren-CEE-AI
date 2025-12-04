"""Get AI config endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.ai_configuration import AIConfiguration
from sqlalchemy import select

config = {
    "name": "GetAIConfig",
    "type": "api",
    "path": "/api/ai/config",
    "method": "GET",
    "responseSchema": {
        "configurations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "format": "uuid"},
                    "config_key": {"type": "string"},
                    "provider": {"type": "string"},
                    "model_name": {"type": "string"},
                    "is_active": {"type": "boolean"},
                    "priority": {"type": "integer"}
                }
            }
        }
    }
}

async def handler(req, context):
    """Handle get AI config request."""
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
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            result = await db.execute(
                select(AIConfiguration).where(AIConfiguration.is_active == True)
                .order_by(AIConfiguration.priority.desc())
            )
            configs = result.scalars().all()
            
            return {
                "status": 200,
                "body": {
                    "configurations": [
                        {
                            "id": str(c.id),
                            "config_key": c.config_key,
                            "provider": c.provider,
                            "model_name": c.model_name,
                            "is_active": c.is_active,
                            "priority": c.priority
                        }
                        for c in configs
                    ]
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting AI config: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

