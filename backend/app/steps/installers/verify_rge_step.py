"""Verify RGE status endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.installer import Installer
from sqlalchemy import select

config = {
    "name": "VerifyRGE",
    "type": "api",
    "path": "/api/installers/{installer_id}/verify-rge",
    "method": "POST",
    "bodySchema": {
        "rge_number": {"type": "string"},
        "rge_valid_until": {"type": "string", "format": "date"}
    },
    "responseSchema": {
        "status": {"type": "string"},
        "message": {"type": "string"}
    }
}

async def handler(req, context):
    """Handle verify RGE request."""
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
    installer_id_str = path_params.get("installer_id")
    
    if not installer_id_str:
        return {"status": 400, "body": {"detail": "installer_id is required"}}
    
    try:
        installer_id = UUID(installer_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid installer_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            result = await db.execute(select(Installer).where(Installer.id == installer_id))
            installer = result.scalar_one_or_none()
            
            if not installer:
                return {"status": 404, "body": {"detail": "Installer not found"}}
            
            # TODO: Implement actual RGE verification logic
            installer.rge_status = "verified"
            await db.commit()
            
            return {
                "status": 200,
                "body": {"status": "verified", "message": "RGE status verified"}
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error verifying RGE: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

