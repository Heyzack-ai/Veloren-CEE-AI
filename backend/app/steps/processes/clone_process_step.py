"""Clone process endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.process import Process
from sqlalchemy import select

config = {
    "name": "CloneProcess",
    "type": "api",
    "path": "/api/processes/{process_id}/clone",
    "method": "POST"
}

async def handler(req, context):
    """Handle clone process request."""
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
    new_code = body.get("new_code")
    
    if not process_id_str:
        return {"status": 400, "body": {"detail": "process_id is required"}}
    if not new_code:
        return {"status": 400, "body": {"detail": "new_code is required"}}
    
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
            original = result.scalar_one_or_none()
            
            if not original:
                return {"status": 404, "body": {"detail": "Process not found"}}
            
            check_result = await db.execute(select(Process).where(Process.code == new_code))
            if check_result.scalar_one_or_none():
                return {
                    "status": 400,
                    "body": {"detail": "Process code already exists"}
                }
            
            clone_data = {
                "code": new_code,
                "name": original.name,
                "category": original.category,
                "description": original.description,
                "version": "1.0",
                "is_coup_de_pouce": original.is_coup_de_pouce,
                "valid_from": original.valid_from,
                "valid_until": original.valid_until,
                "required_documents": original.required_documents,
                "is_active": False
            }
            
            clone = Process(**clone_data)
            db.add(clone)
            await db.commit()
            await db.refresh(clone)
            
            return {
                "status": 201,
                "body": {
                    "id": str(clone.id),
                    "code": clone.code,
                    "name": clone.name,
                    "is_active": clone.is_active
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error cloning process: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

