"""List AI providers endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.ai_configuration import AIConfiguration
from sqlalchemy import select, func

config = {
    "name": "ListAIProviders",
    "type": "api",
    "path": "/api/ai/providers",
    "method": "GET",
    "responseSchema": {
        "providers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "total_configs": {"type": "integer"},
                    "active_configs": {"type": "integer"},
                    "configurations": {
                        "type": "array",
                        "items": {"type": "object"}
                    }
                }
            }
        },
        "total": {"type": "integer"}
    }
}

async def handler(req, context):
    """Handle list AI providers request."""
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
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get unique providers
            providers_result = await db.execute(
                select(AIConfiguration.provider, func.count(AIConfiguration.id))
                .group_by(AIConfiguration.provider)
            )
            providers = {}
            for row in providers_result.all():
                provider_name = row[0]
                count = row[1]
                
                # Get active configs for this provider
                configs_result = await db.execute(
                    select(AIConfiguration)
                    .where(AIConfiguration.provider == provider_name)
                    .where(AIConfiguration.is_active == True)
                    .order_by(AIConfiguration.priority.desc())
                )
                configs = configs_result.scalars().all()
                
                providers[provider_name] = {
                    "name": provider_name,
                    "total_configs": count,
                    "active_configs": len(configs),
                    "configurations": [
                        {
                            "id": str(c.id),
                            "config_key": c.config_key,
                            "model_name": c.model_name,
                            "model_version": c.model_version,
                            "is_active": c.is_active,
                            "priority": c.priority
                        }
                        for c in configs
                    ]
                }
            
            return {
                "status": 200,
                "body": {
                    "providers": list(providers.values()),
                    "total": len(providers)
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing AI providers: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

