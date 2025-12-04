"""Search documents endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.services.search import SearchService

config = {
    "name": "SearchDocuments",
    "type": "api",
    "path": "/api/search/documents",
    "method": "GET"
}

async def handler(req, context):
    """Handle search documents request."""
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
    
    page = int(query.get("page", 1))
    per_page = min(int(query.get("per_page", 20)), 100)
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            
            service = SearchService()
            result = await service.search_documents(q, page=page, per_page=per_page)
            
            return {
                "status": 200,
                "body": {
                    "hits": result.hits,
                    "total": result.total,
                    "page": result.page,
                    "total_pages": result.total_pages
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error searching documents: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

