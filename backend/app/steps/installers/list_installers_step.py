"""List installers endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.installer import Installer
from sqlalchemy import select

config = {
    "name": "ListInstallers",
    "type": "api",
    "path": "/api/installers",
    "method": "GET",
    "responseSchema": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "siret": {"type": "string"},
                "company_name": {"type": "string"},
                "city": {"type": "string"},
                "active": {"type": "boolean"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        }
    }
}

async def handler(req, context):
    """Handle list installers request."""
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
    active_str = query.get("active")
    city = query.get("city")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            query_obj = select(Installer)
            
            if active_str is not None:
                query_obj = query_obj.where(Installer.active == (active_str.lower() == "true"))
            if city:
                query_obj = query_obj.where(Installer.city == city)
            
            query_obj = query_obj.order_by(Installer.company_name)
            result = await db.execute(query_obj)
            installers = result.scalars().all()
            
            return {
                "status": 200,
                "body": [
                    {
                        "id": str(i.id),
                        "siret": i.siret,
                        "company_name": i.company_name,
                        "city": i.city,
                        "active": i.active,
                        "created_at": i.created_at.isoformat() if i.created_at else None
                    }
                    for i in installers
                ]
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing installers: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

