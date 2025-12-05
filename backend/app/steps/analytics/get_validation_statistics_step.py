"""Get validation statistics endpoint step."""
from datetime import date
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier, DossierStatus
from app.models.extracted_field import ExtractedField, FieldStatus
from app.models.validation_result import ValidationResult
from sqlalchemy import select, func

config = {
    "name": "GetValidationStatistics",
    "type": "api",
    "path": "/api/analytics/validation",
    "method": "GET",
    "responseSchema": {
        "dossiers": {
            "type": "object",
            "properties": {
                "total": {"type": "integer"},
                "approved": {"type": "integer"},
                "rejected": {"type": "integer"},
                "in_review": {"type": "integer"},
                "approval_rate": {"type": "number"}
            }
        },
        "fields": {
            "type": "object",
            "properties": {
                "total": {"type": "integer"},
                "confirmed": {"type": "integer"},
                "corrected": {"type": "integer"},
                "unreviewed": {"type": "integer"},
                "avg_confidence": {"type": "number"}
            }
        },
        "validation_rules": {
            "type": "object",
            "properties": {
                "total": {"type": "integer"},
                "passed": {"type": "integer"},
                "failed": {"type": "integer"},
                "overridden": {"type": "integer"},
                "override_rate": {"type": "number"}
            }
        }
    }
}

async def handler(req, context):
    """Handle get validation statistics request."""
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
            
            # Get dossier statistics
            dossier_result = await db.execute(dossier_query)
            all_dossiers = dossier_result.scalars().all()
            
            approved_count = sum(1 for d in all_dossiers if d.status == DossierStatus.APPROVED)
            rejected_count = sum(1 for d in all_dossiers if d.status == DossierStatus.REJECTED)
            in_review_count = sum(1 for d in all_dossiers if d.status == DossierStatus.IN_REVIEW)
            approval_rate = approved_count / len(all_dossiers) if all_dossiers else 0.0
            
            # Get field statistics
            field_result = await db.execute(select(ExtractedField))
            all_fields = field_result.scalars().all()
            
            confirmed_count = sum(1 for f in all_fields if f.status == FieldStatus.CONFIRMED)
            corrected_count = sum(1 for f in all_fields if f.status == FieldStatus.CORRECTED)
            unreviewed_count = sum(1 for f in all_fields if f.status == FieldStatus.UNREVIEWED)
            
            confidences = [float(f.confidence) for f in all_fields if f.confidence]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            # Get validation result statistics
            rule_result = await db.execute(select(ValidationResult))
            all_results = rule_result.scalars().all()
            
            passed_count = sum(1 for r in all_results if r.passed)
            failed_count = len(all_results) - passed_count
            overridden_count = sum(1 for r in all_results if r.overridden)
            
            return {
                "status": 200,
                "body": {
                    "dossiers": {
                        "total": len(all_dossiers),
                        "approved": approved_count,
                        "rejected": rejected_count,
                        "in_review": in_review_count,
                        "approval_rate": approval_rate
                    },
                    "fields": {
                        "total": len(all_fields),
                        "confirmed": confirmed_count,
                        "corrected": corrected_count,
                        "unreviewed": unreviewed_count,
                        "avg_confidence": avg_confidence
                    },
                    "validation_rules": {
                        "total": len(all_results),
                        "passed": passed_count,
                        "failed": failed_count,
                        "overridden": overridden_count,
                        "override_rate": overridden_count / len(all_results) if all_results else 0.0
                    }
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting validation statistics: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

