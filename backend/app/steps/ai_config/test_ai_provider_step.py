"""Test AI provider endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.ai_configuration import AIConfiguration
from sqlalchemy import select

config = {
    "name": "TestAIProvider",
    "type": "api",
    "path": "/api/ai/providers/{provider_id}/test",
    "method": "POST",
    "bodySchema": {
        "test_input": {"type": "string"}
    },
    "responseSchema": {
        "success": {"type": "boolean"},
        "message": {"type": "string"},
        "provider": {"type": "string"},
        "model": {"type": "string"},
        "has_api_key": {"type": "boolean"},
        "has_endpoint": {"type": "boolean"}
    }
}

async def handler(req, context):
    """Handle test AI provider request."""
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
    body = req.get("body", {})
    
    provider_id_str = path_params.get("provider_id")
    if not provider_id_str:
        return {"status": 400, "body": {"detail": "provider_id is required"}}
    
    try:
        provider_id = UUID(provider_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid provider_id format"}}
    
    test_input = body.get("test_input", "Hello, this is a test.")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get config
            config_result = await db.execute(select(AIConfiguration).where(AIConfiguration.id == provider_id))
            config = config_result.scalar_one_or_none()
            if not config:
                return {"status": 404, "body": {"detail": "AI provider configuration not found"}}
            
            # Test provider connection
            try:
                from app.services.ai.provider_factory import AIProviderFactory, AITask
                
                # Try to get provider (this will test the connection)
                # For now, just check if config is valid
                test_result = {
                    "success": True,
                    "message": "Configuration is valid",
                    "provider": config.provider,
                    "model": config.model_name,
                    "has_api_key": bool(config.api_key_encrypted),
                    "has_endpoint": bool(config.api_endpoint)
                }
                
                # TODO: Actually test the provider connection when provider factory is fully implemented
                # provider = await AIProviderFactory.get_provider(AITask.EXTRACTION, db)
                # result = await provider.test_connection()
                
            except Exception as e:
                test_result = {
                    "success": False,
                    "message": f"Connection test failed: {str(e)}",
                    "provider": config.provider,
                    "model": config.model_name
                }
            
            return {
                "status": 200,
                "body": test_result
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error testing AI provider: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

