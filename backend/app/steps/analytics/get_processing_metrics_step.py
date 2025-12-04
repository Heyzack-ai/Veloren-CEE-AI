"""Get processing metrics endpoint step."""
from datetime import date
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier
from app.models.document import Document, ProcessingStatus
from sqlalchemy import select, func

config = {
    "name": "GetProcessingMetrics",
    "type": "api",
    "path": "/api/analytics/processing",
    "method": "GET"
}

async def handler(req, context):
    """Handle get processing metrics request."""
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
    date_from_str = query.get("date_from")
    date_to_str = query.get("date_to")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            # Build date filter
            dossier_query = select(Dossier)
            if date_from_str:
                try:
                    date_from = date.fromisoformat(date_from_str)
                    dossier_query = dossier_query.where(Dossier.created_at >= date_from)
                except ValueError:
                    pass
            if date_to_str:
                try:
                    date_to = date.fromisoformat(date_to_str)
                    dossier_query = dossier_query.where(Dossier.created_at <= date_to)
                except ValueError:
                    pass
            
            # Get dossier processing times
            dossier_result = await db.execute(dossier_query)
            all_dossiers = dossier_result.scalars().all()
            
            processing_times = [d.processing_time_ms for d in all_dossiers if d.processing_time_ms]
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0.0
            min_processing_time = min(processing_times) if processing_times else 0
            max_processing_time = max(processing_times) if processing_times else 0
            
            # Get document processing statistics
            doc_result = await db.execute(select(Document))
            all_documents = doc_result.scalars().all()
            
            pending_count = sum(1 for d in all_documents if d.processing_status == ProcessingStatus.PENDING)
            processing_count = sum(1 for d in all_documents if d.processing_status == ProcessingStatus.PROCESSING)
            completed_count = sum(1 for d in all_documents if d.processing_status == ProcessingStatus.COMPLETED)
            failed_count = sum(1 for d in all_documents if d.processing_status == ProcessingStatus.FAILED)
            
            # Calculate average document processing time
            doc_processing_times = [d.processing_time_ms for d in all_documents if d.processing_time_ms]
            avg_doc_processing_time = sum(doc_processing_times) / len(doc_processing_times) if doc_processing_times else 0.0
            
            return {
                "status": 200,
                "body": {
                    "dossiers": {
                        "total": len(all_dossiers),
                        "avg_processing_time_ms": avg_processing_time,
                        "min_processing_time_ms": min_processing_time,
                        "max_processing_time_ms": max_processing_time
                    },
                    "documents": {
                        "total": len(all_documents),
                        "pending": pending_count,
                        "processing": processing_count,
                        "completed": completed_count,
                        "failed": failed_count,
                        "avg_processing_time_ms": avg_doc_processing_time,
                        "success_rate": completed_count / len(all_documents) if all_documents else 0.0
                    }
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting processing metrics: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

