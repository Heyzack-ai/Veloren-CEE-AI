"""Upload document endpoint step."""
from uuid import UUID
from io import BytesIO
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.core.config import settings
from app.models.dossier import Dossier
from app.models.document import Document, ProcessingStatus
from app.services.pdf_storage import PDFStorageService
from app.services.activity import ActivityLogger
from sqlalchemy import select

config = {
    "name": "UploadDocument",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/documents",
    "method": "POST"
}

async def handler(req, context):
    """Handle upload document request."""
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
    dossier_id_str = path_params.get("dossier_id")
    body = req.get("body", {})
    
    if not dossier_id_str:
        return {"status": 400, "body": {"detail": "dossier_id is required"}}
    
    # Handle file upload from multipart form
    file_data = body.get("file")
    if not file_data:
        return {"status": 400, "body": {"detail": "File is required"}}
    
    try:
        dossier_id = UUID(dossier_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid dossier_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            
            dossier_result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = dossier_result.scalar_one_or_none()
            
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            # Extract file info
            filename = file_data.get("filename", "unknown")
            content = file_data.get("content", b"")
            content_type = file_data.get("content_type", "application/pdf")
            
            file_size = len(content)
            if file_size > settings.MAX_FILE_SIZE:
                return {
                    "status": 413,
                    "body": {"detail": f"File size exceeds maximum of {settings.MAX_FILE_SIZE} bytes"}
                }
            
            # Create file-like object (compatible with PDFStorageService)
            class FileLike:
                def __init__(self, filename, content, content_type):
                    self.filename = filename
                    self.file = BytesIO(content)
                    self.content_type = content_type
                    self.size = len(content)
                
                async def read(self):
                    return self.file.read()
                
                def seek(self, pos):
                    self.file.seek(pos)
            
            file_obj = FileLike(filename, content, content_type)
            
            # Save file
            storage_service = PDFStorageService()
            storage_path, saved_size = await storage_service.save_file(file_obj, dossier_id)
            
            # Get document_type_id from body if provided
            document_type_id = None
            if "document_type_id" in body:
                try:
                    document_type_id = UUID(body["document_type_id"])
                except ValueError:
                    pass
            
            # Create document record
            document = Document(
                dossier_id=dossier_id,
                document_type_id=document_type_id,
                filename=storage_path.split("/")[-1],
                original_filename=filename,
                storage_path=storage_path,
                mime_type=content_type,
                file_size=saved_size,
                processing_status=ProcessingStatus.PENDING
            )
            
            db.add(document)
            await db.commit()
            await db.refresh(document)
            
            # Log activity
            logger = ActivityLogger(db)
            await logger.log(
                user_id=str(current_user.id),
                action_type="document.uploaded",
                entity_type="document",
                entity_id=str(document.id),
                description=f"Document {filename} uploaded to dossier {dossier.reference}"
            )
            
            return {
                "status": 201,
                "body": {
                    "id": str(document.id),
                    "filename": document.filename,
                    "original_filename": document.original_filename,
                    "file_size": document.file_size,
                    "processing_status": document.processing_status.value if hasattr(document.processing_status, "value") else str(document.processing_status),
                    "uploaded_at": document.uploaded_at.isoformat() if document.uploaded_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error uploading document: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

