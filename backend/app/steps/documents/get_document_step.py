"""Get document endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.document import Document
from sqlalchemy import select

config = {
    "name": "GetDocument",
    "type": "api",
    "path": "/api/documents/{document_id}",
    "method": "GET",
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "dossier_id": {"type": "string", "format": "uuid"},
        "filename": {"type": "string"},
        "original_filename": {"type": "string"},
        "file_size": {"type": "integer"},
        "mime_type": {"type": "string"},
        "processing_status": {"type": "string"},
        "uploaded_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle get document request."""
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
    document_id_str = path_params.get("document_id")
    
    if not document_id_str:
        return {"status": 400, "body": {"detail": "document_id is required"}}
    
    try:
        document_id = UUID(document_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid document_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            
            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            
            if not document:
                return {"status": 404, "body": {"detail": "Document not found"}}
            
            return {
                "status": 200,
                "body": {
                    "id": str(document.id),
                    "dossier_id": str(document.dossier_id),
                    "filename": document.filename,
                    "original_filename": document.original_filename,
                    "file_size": document.file_size,
                    "mime_type": document.mime_type,
                    "processing_status": document.processing_status.value if hasattr(document.processing_status, "value") else str(document.processing_status),
                    "uploaded_at": document.uploaded_at.isoformat() if document.uploaded_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting document: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

