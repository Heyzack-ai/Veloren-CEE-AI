"""List AI models endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.ai_configuration import AIConfiguration
from sqlalchemy import select, func

config = {
    "name": "ListAIModels",
    "type": "api",
    "path": "/api/ai/models",
    "method": "GET",
    "responseSchema": {
        "models_by_provider": {"type": "object"},
        "total_models": {"type": "integer"}
    }
}

async def handler(req, context):
    """Handle list AI models request."""
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
    provider = query.get("provider")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Build query
            query_obj = select(AIConfiguration)
            if provider:
                query_obj = query_obj.where(AIConfiguration.provider == provider)
            
            result = await db.execute(query_obj.order_by(AIConfiguration.provider, AIConfiguration.model_name))
            configs = result.scalars().all()
            
            # Group by provider and model
            models_by_provider = {}
            for config in configs:
                provider_name = config.provider
                if provider_name not in models_by_provider:
                    models_by_provider[provider_name] = []
                
                models_by_provider[provider_name].append({
                    "id": str(config.id),
                    "config_key": config.config_key,
                    "model_name": config.model_name,
                    "model_version": config.model_version,
                    "is_active": config.is_active,
                    "priority": config.priority,
                    "created_at": config.created_at.isoformat() if config.created_at else None
                })
            
            return {
                "status": 200,
                "body": {
                    "models_by_provider": models_by_provider,
                    "total_models": len(configs)
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing AI models: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

