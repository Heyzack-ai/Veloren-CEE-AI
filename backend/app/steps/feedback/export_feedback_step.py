"""Export feedback endpoint step."""
import json
from datetime import datetime
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.feedback import HumanFeedback
from sqlalchemy import select

config = {
    "name": "ExportFeedback",
    "type": "api",
    "path": "/api/feedback/export",
    "method": "POST",
    "bodySchema": {
        "format": {"type": "string", "enum": ["json", "csv"]},
        "used_for_training_only": {"type": "boolean"}
    }
}

async def handler(req, context):
    """Handle export feedback request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    body = req.get("body", {})
    
    export_format = body.get("format", "json")
    used_for_training_only = body.get("used_for_training_only", False)
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Build query
            query = select(HumanFeedback)
            if used_for_training_only:
                query = query.where(HumanFeedback.used_for_training == True)
            
            result = await db.execute(query.order_by(HumanFeedback.created_at.desc()))
            feedbacks = result.scalars().all()
            
            # Format data
            export_data = []
            for feedback in feedbacks:
                export_data.append({
                    "id": str(feedback.id),
                    "dossier_id": str(feedback.dossier_id) if feedback.dossier_id else None,
                    "document_id": str(feedback.document_id) if feedback.document_id else None,
                    "extracted_field_id": str(feedback.extracted_field_id) if feedback.extracted_field_id else None,
                    "feedback_type": feedback.feedback_type,
                    "original_value": feedback.original_value,
                    "corrected_value": feedback.corrected_value,
                    "field_name": feedback.field_name,
                    "document_type": feedback.document_type,
                    "context_data": feedback.context_data,
                    "model_used": feedback.model_used,
                    "model_version": feedback.model_version,
                    "confidence_before": float(feedback.confidence_before) if feedback.confidence_before else None,
                    "validator_id": str(feedback.validator_id),
                    "notes": feedback.notes,
                    "used_for_training": feedback.used_for_training,
                    "created_at": feedback.created_at.isoformat() if feedback.created_at else None
                })
            
            if export_format == "csv":
                import csv
                import io
                
                if not export_data:
                    csv_content = "No data to export\n"
                else:
                    output = io.StringIO()
                    writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
                    writer.writeheader()
                    writer.writerows(export_data)
                    csv_content = output.getvalue()
                
                return {
                    "status": 200,
                    "body": {
                        "file_content": csv_content.encode("utf-8"),
                        "content_type": "text/csv",
                        "filename": f"feedback_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                    }
                }
            else:
                return {
                    "status": 200,
                    "body": {
                        "data": export_data,
                        "total": len(export_data),
                        "exported_at": datetime.utcnow().isoformat()
                    }
                }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error exporting feedback: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

