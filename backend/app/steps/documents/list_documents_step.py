"""List documents endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.dossier import Dossier
from app.models.document import Document
from sqlalchemy import select

config = {
    "name": "ListDocuments",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/documents",
    "method": "GET",
    "responseSchema": {
        "documents": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "format": "uuid"},
                    "filename": {"type": "string"},
                    "original_filename": {"type": "string"},
                    "file_size": {"type": "integer"},
                    "mime_type": {"type": "string"},
                    "processing_status": {"type": "string"},
                    "uploaded_at": {"type": "string", "format": "date-time"}
                }
            }
        },
        "total": {"type": "integer"}
    }
}

async def handler(req, context):
    """Handle list documents request."""
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
    
    if not dossier_id_str:
        return {"status": 400, "body": {"detail": "dossier_id is required"}}
    
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
            
            result = await db.execute(
                select(Document).where(Document.dossier_id == dossier_id)
                .order_by(Document.uploaded_at.desc())
            )
            documents = result.scalars().all()
            
            return {
                "status": 200,
                "body": {
                    "documents": [
                        {
                            "id": str(d.id),
                            "filename": d.filename,
                            "original_filename": d.original_filename,
                            "file_size": d.file_size,
                            "mime_type": d.mime_type,
                            "processing_status": d.processing_status.value if hasattr(d.processing_status, "value") else str(d.processing_status),
                            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
                        }
                        for d in documents
                    ],
                    "total": len(documents)
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing documents: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

