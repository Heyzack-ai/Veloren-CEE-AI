"""Get extracted fields endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier
from sqlalchemy import select

config = {
    "name": "GetExtractedFields",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/fields",
    "method": "GET"
}

async def handler(req, context):
    """Handle get extracted fields request."""
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
    dossier_id_str = path_params.get("dossier_id")
    
    if not dossier_id_str:
        return {"status": 400, "body": {"detail": "dossier_id is required"}}
    
    try:
        dossier_id = UUID(dossier_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid dossier_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.VALIDATOR, UserRole.ADMINISTRATOR])
            
            result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = result.scalar_one_or_none()
            
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            # TODO: Implement extracted fields retrieval
            return {
                "status": 200,
                "body": {"fields": []}
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting extracted fields: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

