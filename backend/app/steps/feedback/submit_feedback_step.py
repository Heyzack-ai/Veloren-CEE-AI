"""Submit feedback endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.feedback import HumanFeedback

config = {
    "name": "SubmitFeedback",
    "type": "api",
    "path": "/api/feedback",
    "method": "POST",
    "bodySchema": {
        "dossier_id": {"type": "string", "format": "uuid"},
        "document_id": {"type": "string", "format": "uuid"},
        "field_id": {"type": "string", "format": "uuid"},
        "feedback_type": {"type": "string", "enum": ["correction", "improvement", "error"], "required": True},
        "feedback_text": {"type": "string", "required": True},
        "suggested_value": {"type": "string"},
        "is_used_for_training": {"type": "boolean"}
    },
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "validator_id": {"type": "string", "format": "uuid"},
        "feedback_type": {"type": "string"},
        "created_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle submit feedback request."""
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
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.VALIDATOR])
            
            feedback = HumanFeedback(**body, validator_id=current_user.id)
            db.add(feedback)
            await db.commit()
            await db.refresh(feedback)
            
            return {
                "status": 201,
                "body": {
                    "id": str(feedback.id),
                    "validator_id": str(feedback.validator_id),
                    "feedback_type": feedback.feedback_type,
                    "created_at": feedback.created_at.isoformat() if feedback.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error submitting feedback: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

