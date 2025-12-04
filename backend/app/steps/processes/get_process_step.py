"""Get process endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.process import Process
from sqlalchemy import select

config = {
    "name": "GetProcess",
    "type": "api",
    "path": "/api/processes/{process_id}",
    "method": "GET"
}

async def handler(req, context):
    """Handle get process request."""
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
            
            result = await db.execute(select(Process).where(Process.id == process_id))
            process = result.scalar_one_or_none()
            
            if not process:
                return {"status": 404, "body": {"detail": "Process not found"}}
            
            return {
                "status": 200,
                "body": {
                    "id": str(process.id),
                    "code": process.code,
                    "name": process.name,
                    "category": process.category,
                    "description": process.description,
                    "is_active": process.is_active,
                    "created_at": process.created_at.isoformat() if process.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting process: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

