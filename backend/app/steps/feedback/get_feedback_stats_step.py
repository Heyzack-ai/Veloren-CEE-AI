"""Get feedback statistics endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.feedback import HumanFeedback
from sqlalchemy import select, func

config = {
    "name": "GetFeedbackStats",
    "type": "api",
    "path": "/api/feedback/stats",
    "method": "GET"
}

async def handler(req, context):
    """Handle get feedback stats request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get total feedback count
            total_result = await db.execute(select(func.count(HumanFeedback.id)))
            total = total_result.scalar() or 0
            
            # Get feedback by type
            type_result = await db.execute(
                select(HumanFeedback.feedback_type, func.count(HumanFeedback.id))
                .group_by(HumanFeedback.feedback_type)
            )
            by_type = {row[0]: row[1] for row in type_result.all()}
            
            # Get used for training count
            training_result = await db.execute(
                select(func.count(HumanFeedback.id)).where(HumanFeedback.used_for_training == True)
            )
            used_for_training = training_result.scalar() or 0
            
            # Get average confidence before
            confidence_result = await db.execute(
                select(func.avg(HumanFeedback.confidence_before)).where(HumanFeedback.confidence_before.isnot(None))
            )
            avg_confidence = float(confidence_result.scalar() or 0)
            
            return {
                "status": 200,
                "body": {
                    "total": total,
                    "by_type": by_type,
                    "used_for_training": used_for_training,
                    "not_used_for_training": total - used_for_training,
                    "avg_confidence_before": avg_confidence
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting feedback stats: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

