"""Create process endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.process import Process
from app.schemas.process import ProcessCreate
from sqlalchemy import select

config = {
    "name": "CreateProcess",
    "type": "api",
    "path": "/api/processes",
    "method": "POST",
    "bodySchema": {
        "code": {"type": "string", "required": True},
        "name": {"type": "string", "required": True},
        "description": {"type": "string"},
        "category": {"type": "string"},
        "version": {"type": "string"},
        "is_active": {"type": "boolean"},
        "is_system": {"type": "boolean"},
        "is_coup_de_pouce": {"type": "boolean"},
        "valid_from": {"type": "string", "format": "date"},
        "valid_until": {"type": "string", "format": "date"},
        "metadata": {"type": "object"}
    }
}

async def handler(req, context):
    """Handle create process request."""
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
            
            process_data = ProcessCreate(**body)
            
            result = await db.execute(select(Process).where(Process.code == process_data.code))
            if result.scalar_one_or_none():
                return {
                    "status": 400,
                    "body": {"detail": "Process code already exists"}
                }
            
            process = Process(**process_data.model_dump())
            db.add(process)
            await db.commit()
            await db.refresh(process)
            
            return {
                "status": 201,
                "body": {
                    "id": str(process.id),
                    "code": process.code,
                    "name": process.name,
                    "category": process.category,
                    "is_active": process.is_active,
                    "created_at": process.created_at.isoformat() if process.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error creating process: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

