"""Download document endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.document import Document
from app.services.pdf_storage import PDFStorageService
from sqlalchemy import select

config = {
    "name": "DownloadDocument",
    "type": "api",
    "path": "/api/documents/{document_id}/download",
    "method": "GET"
}

async def handler(req, context):
    """Handle download document request."""
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
            
            storage_service = PDFStorageService()
            content = await storage_service.get_file_content(document.storage_path)
            
            if not content:
                return {"status": 404, "body": {"detail": "File not found in storage"}}
            
            return {
                "status": 200,
                "body": {
                    "file_content": content,
                    "content_type": document.mime_type,
                    "filename": document.original_filename
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error downloading document: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

