"""Get installer endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.installer import Installer
from sqlalchemy import select

config = {
    "name": "GetInstaller",
    "type": "api",
    "path": "/api/installers/{installer_id}",
    "method": "GET"
}

async def handler(req, context):
    """Handle get installer request."""
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
            
            result = await db.execute(select(Installer).where(Installer.id == installer_id))
            installer = result.scalar_one_or_none()
            
            if not installer:
                return {"status": 404, "body": {"detail": "Installer not found"}}
            
            return {
                "status": 200,
                "body": {
                    "id": str(installer.id),
                    "siret": installer.siret,
                    "company_name": installer.company_name,
                    "city": installer.city,
                    "active": installer.active,
                    "created_at": installer.created_at.isoformat() if installer.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting installer: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

