"""Update AI config endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.ai_configuration import AIConfiguration
from sqlalchemy import select

config = {
    "name": "UpdateAIConfig",
    "type": "api",
    "path": "/api/ai/config",
    "method": "PATCH",
    "bodySchema": {
        "config_key": {"type": "string"},
        "provider": {"type": "string"},
        "model_name": {"type": "string"},
        "model_version": {"type": "string"},
        "api_endpoint": {"type": "string"},
        "api_key_encrypted": {"type": "string"},
        "parameters": {"type": "object"},
        "is_active": {"type": "boolean"},
        "priority": {"type": "integer"}
    },
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "config_key": {"type": "string"},
        "provider": {"type": "string"},
        "model_name": {"type": "string"},
        "model_version": {"type": "string"},
        "is_active": {"type": "boolean"},
        "priority": {"type": "integer"},
        "updated_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle update AI config request."""
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
    
    config_key = body.get("config_key")
    if not config_key:
        return {"status": 422, "body": {"detail": "config_key is required"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get config
            config_result = await db.execute(
                select(AIConfiguration).where(AIConfiguration.config_key == config_key)
            )
            config = config_result.scalar_one_or_none()
            
            if not config:
                # Create new config if it doesn't exist
                config = AIConfiguration(
                    config_key=config_key,
                    provider=body.get("provider", "openai"),
                    model_name=body.get("model_name", ""),
                    model_version=body.get("model_version"),
                    api_endpoint=body.get("api_endpoint"),
                    api_key_encrypted=body.get("api_key_encrypted"),
                    parameters=body.get("parameters", {}),
                    is_active=body.get("is_active", True),
                    priority=body.get("priority", 0)
                )
                db.add(config)
            else:
                # Update existing config
                if "provider" in body:
                    config.provider = body["provider"]
                if "model_name" in body:
                    config.model_name = body["model_name"]
                if "model_version" in body:
                    config.model_version = body["model_version"]
                if "api_endpoint" in body:
                    config.api_endpoint = body["api_endpoint"]
                if "api_key_encrypted" in body:
                    config.api_key_encrypted = body["api_key_encrypted"]
                if "parameters" in body:
                    config.parameters = body["parameters"]
                if "is_active" in body:
                    config.is_active = body["is_active"]
                if "priority" in body:
                    config.priority = body["priority"]
            
            await db.commit()
            await db.refresh(config)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="ai_config.updated",
                    entity_type="ai_configuration",
                    entity_id=str(config.id),
                    description=f"AI config {config_key} updated"
                )
            except Exception:
                pass
            
            return {
                "status": 200,
                "body": {
                    "id": str(config.id),
                    "config_key": config.config_key,
                    "provider": config.provider,
                    "model_name": config.model_name,
                    "model_version": config.model_version,
                    "is_active": config.is_active,
                    "priority": config.priority,
                    "updated_at": config.updated_at.isoformat() if config.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating AI config: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

