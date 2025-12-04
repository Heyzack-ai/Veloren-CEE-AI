"""Get dashboard metrics endpoint step."""
from datetime import date
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier
from app.models.extracted_field import ExtractedField
from app.models.validation_result import ValidationResult
from sqlalchemy import select

config = {
    "name": "GetDashboardMetrics",
    "type": "api",
    "path": "/api/analytics/dashboard",
    "method": "GET"
}

async def handler(req, context):
    """Handle get dashboard metrics request."""
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
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
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
            
            dossier_result = await db.execute(dossier_query)
            all_dossiers = dossier_result.scalars().all()
            
            by_status = {}
            for dossier in all_dossiers:
                status_val = dossier.status.value if hasattr(dossier.status, "value") else str(dossier.status)
                by_status[status_val] = by_status.get(status_val, 0) + 1
            
            today = date.today()
            submitted_today = sum(1 for d in all_dossiers if d.submitted_at and d.submitted_at.date() == today)
            validated_today = sum(1 for d in all_dossiers if d.validated_at and d.validated_at.date() == today)
            
            processing_times = [d.processing_time_ms for d in all_dossiers if d.processing_time_ms]
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0.0
            
            field_result = await db.execute(select(ExtractedField))
            all_fields = field_result.scalars().all()
            
            pending_review = sum(1 for f in all_fields if hasattr(f.status, "value") and f.status.value == "unreviewed")
            confidences = [f.confidence for f in all_fields if f.confidence]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            rule_result = await db.execute(select(ValidationResult))
            all_results = rule_result.scalars().all()
            
            overridden = sum(1 for r in all_results if r.overridden)
            override_rate = overridden / len(all_results) if all_results else 0.0
            
            return {
                "status": 200,
                "body": {
                    "dossiers": {
                        "total": len(all_dossiers),
                        "by_status": by_status,
                        "submitted_today": submitted_today,
                        "validated_today": validated_today,
                        "avg_processing_time": avg_processing_time
                    },
                    "validation": {
                        "pending_review": pending_review,
                        "avg_confidence": float(avg_confidence),
                        "correction_rate": 0.0,
                        "override_rate": override_rate
                    },
                    "performance": {
                        "avg_validation_time": avg_processing_time,
                        "dossiers_per_validator": {},
                        "ai_model_accuracy": {}
                    }
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting dashboard metrics: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

