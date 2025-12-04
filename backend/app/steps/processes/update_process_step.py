"""Update process endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.process import Process
from app.schemas.process import ProcessUpdate
from sqlalchemy import select

config = {
    "name": "UpdateProcess",
    "type": "api",
    "path": "/api/processes/{process_id}",
    "method": "PATCH"
}

async def handler(req, context):
    """Handle update process request."""
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
    process_id_str = path_params.get("process_id")
    body = req.get("body", {})
    
    if not process_id_str:
        return {"status": 400, "body": {"detail": "process_id is required"}}
    
    try:
        process_id = UUID(process_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid process_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            result = await db.execute(select(Process).where(Process.id == process_id))
            process = result.scalar_one_or_none()
            
            if not process:
                return {"status": 404, "body": {"detail": "Process not found"}}
            
            process_data = ProcessUpdate(**body)
            update_data = process_data.model_dump(exclude_unset=True)
            
            for field, value in update_data.items():
                setattr(process, field, value)
            
            await db.commit()
            await db.refresh(process)
            
            return {
                "status": 200,
                "body": {
                    "id": str(process.id),
                    "code": process.code,
                    "name": process.name,
                    "category": process.category,
                    "is_active": process.is_active,
                    "updated_at": process.updated_at.isoformat() if process.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating process: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

