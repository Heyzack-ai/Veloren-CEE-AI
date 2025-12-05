"""Get feedback endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.feedback import HumanFeedback
from sqlalchemy import select

config = {
    "name": "GetFeedback",
    "type": "api",
    "path": "/api/feedback/{feedback_id}",
    "method": "GET",
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "dossier_id": {"type": "string", "format": "uuid"},
        "document_id": {"type": "string", "format": "uuid"},
        "extracted_field_id": {"type": "string", "format": "uuid"},
        "feedback_type": {"type": "string"},
        "original_value": {"type": "string"},
        "corrected_value": {"type": "string"},
        "field_name": {"type": "string"},
        "validator_id": {"type": "string", "format": "uuid"},
        "used_for_training": {"type": "boolean"},
        "created_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle get feedback request."""
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
    
    feedback_id_str = path_params.get("feedback_id")
    if not feedback_id_str:
        return {"status": 400, "body": {"detail": "feedback_id is required"}}
    
    try:
        feedback_id = UUID(feedback_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid feedback_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            # Get feedback
            feedback_result = await db.execute(select(HumanFeedback).where(HumanFeedback.id == feedback_id))
            feedback = feedback_result.scalar_one_or_none()
            if not feedback:
                return {"status": 404, "body": {"detail": "Feedback not found"}}
            
            return {
                "status": 200,
                "body": {
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
                    "training_batch_id": str(feedback.training_batch_id) if feedback.training_batch_id else None,
                    "created_at": feedback.created_at.isoformat() if feedback.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting feedback: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

