"""List feedback endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.feedback import HumanFeedback
from sqlalchemy import select, func

config = {
    "name": "ListFeedback",
    "type": "api",
    "path": "/api/feedback",
    "method": "GET"
}

async def handler(req, context):
    """Handle list feedback request."""
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
    
    dossier_id_str = query.get("dossier_id")
    feedback_type = query.get("feedback_type")
    used_for_training_str = query.get("used_for_training")
    page = int(query.get("page", 1))
    limit = int(query.get("limit", 50))
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            query_obj = select(HumanFeedback)
            
            if dossier_id_str:
                try:
                    query_obj = query_obj.where(HumanFeedback.dossier_id == UUID(dossier_id_str))
                except ValueError:
                    pass
            if feedback_type:
                query_obj = query_obj.where(HumanFeedback.feedback_type == feedback_type)
            if used_for_training_str is not None:
                query_obj = query_obj.where(HumanFeedback.used_for_training == (used_for_training_str.lower() == "true"))
            
            query_obj = query_obj.order_by(HumanFeedback.created_at.desc())
            query_obj = query_obj.limit(limit).offset((page - 1) * limit)
            
            result = await db.execute(query_obj)
            feedbacks = result.scalars().all()
            
            count_query = select(func.count(HumanFeedback.id))
            if dossier_id_str:
                try:
                    count_query = count_query.where(HumanFeedback.dossier_id == UUID(dossier_id_str))
                except ValueError:
                    pass
            if feedback_type:
                count_query = count_query.where(HumanFeedback.feedback_type == feedback_type)
            if used_for_training_str is not None:
                count_query = count_query.where(HumanFeedback.used_for_training == (used_for_training_str.lower() == "true"))
            
            total_result = await db.execute(count_query)
            total = total_result.scalar() or 0
            
            return {
                "status": 200,
                "body": {
                    "feedback": [
                        {
                            "id": str(f.id),
                            "validator_id": str(f.validator_id),
                            "feedback_type": f.feedback_type,
                            "created_at": f.created_at.isoformat() if f.created_at else None
                        }
                        for f in feedbacks
                    ],
                    "total": total,
                    "page": page,
                    "limit": limit
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing feedback: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

