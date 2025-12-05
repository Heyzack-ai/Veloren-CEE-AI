"""Search dossiers endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.services.search import SearchService

config = {
    "name": "SearchDossiers",
    "type": "api",
    "path": "/api/search/dossiers",
    "method": "GET",
    "responseSchema": {
        "type": "object",
        "properties": {
            "hits": {"type": "array", "items": {"type": "object"}},
            "total": {"type": "integer"},
            "page": {"type": "integer"},
            "total_pages": {"type": "integer"}
        }
    }
}

async def handler(req, context):
    """Handle search dossiers request."""
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
    q = query.get("q")
    
    if not q or len(q) < 1:
        return {"status": 400, "body": {"detail": "Query parameter 'q' is required and must be at least 1 character"}}
    
    status = query.get("status")
    process_code = query.get("process_code")
    page = int(query.get("page", 1))
    per_page = int(query.get("per_page", 20))
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            
            service = SearchService()
            filters = {}
            if status:
                filters["status"] = status
            if process_code:
                filters["process_code"] = process_code
            
            result = await service.search_dossiers(q, filters, page, per_page)
            
            return {
                "status": 200,
                "body": result
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error searching dossiers: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

