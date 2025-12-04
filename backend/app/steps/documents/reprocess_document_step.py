"""Reprocess document endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.document import Document, ProcessingStatus
from app.services.activity import ActivityLogger
from sqlalchemy import select

config = {
    "name": "ReprocessDocument",
    "type": "api",
    "path": "/api/documents/{document_id}/reprocess",
    "method": "POST"
}

async def handler(req, context):
    """Handle reprocess document request."""
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
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            
            if not document:
                return {"status": 404, "body": {"detail": "Document not found"}}
            
            document.processing_status = ProcessingStatus.PENDING
            document.processed_at = None
            document.classification_confidence = None
            
            await db.commit()
            await db.refresh(document)
            
            logger = ActivityLogger(db)
            await logger.log(
                user_id=str(current_user.id),
                action_type="document.reprocessed",
                entity_type="document",
                entity_id=str(document.id),
                description=f"Document {document.filename} marked for reprocessing"
            )
            
            return {
                "status": 200,
                "body": {
                    "id": str(document.id),
                    "filename": document.filename,
                    "processing_status": document.processing_status.value if hasattr(document.processing_status, "value") else str(document.processing_status)
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error reprocessing document: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

