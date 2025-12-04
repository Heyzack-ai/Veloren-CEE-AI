"""List processes endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.process import Process
from sqlalchemy import select

config = {
    "name": "ListProcesses",
    "type": "api",
    "path": "/api/processes",
    "method": "GET"
}

async def handler(req, context):
    """Handle list processes request."""
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
    is_active = query.get("is_active")
    category = query.get("category")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            
            query_obj = select(Process)
            
            if is_active is not None:
                query_obj = query_obj.where(Process.is_active == (is_active.lower() == "true"))
            if category:
                query_obj = query_obj.where(Process.category == category)
            
            query_obj = query_obj.order_by(Process.code)
            result = await db.execute(query_obj)
            processes = result.scalars().all()
            
            return {
                "status": 200,
                "body": [
                    {
                        "id": str(p.id),
                        "code": p.code,
                        "name": p.name,
                        "category": p.category,
                        "is_active": p.is_active,
                        "created_at": p.created_at.isoformat() if p.created_at else None
                    }
                    for p in processes
                ]
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing processes: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

