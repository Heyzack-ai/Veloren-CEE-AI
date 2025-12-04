"""Create installer endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.installer import Installer
from app.schemas.installer import InstallerCreate
from sqlalchemy import select

config = {
    "name": "CreateInstaller",
    "type": "api",
    "path": "/api/installers",
    "method": "POST"
}

async def handler(req, context):
    """Handle create installer request."""
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
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            installer_data = InstallerCreate(**body)
            
            result = await db.execute(select(Installer).where(Installer.siret == installer_data.siret))
            if result.scalar_one_or_none():
                return {
                    "status": 400,
                    "body": {"detail": "SIRET already exists"}
                }
            
            installer = Installer(**installer_data.model_dump())
            db.add(installer)
            await db.commit()
            await db.refresh(installer)
            
            return {
                "status": 201,
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
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error creating installer: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

