"""Confirm extracted field endpoint step."""
from uuid import UUID
from datetime import datetime
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.extracted_field import ExtractedField, FieldStatus
from app.models.dossier import Dossier
from sqlalchemy import select

config = {
    "name": "ConfirmField",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/fields/{field_id}/confirm",
    "method": "POST",
    "bodySchema": {},
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "field_name": {"type": "string"},
        "display_name": {"type": "string"},
        "extracted_value": {"type": "object"},
        "corrected_value": {"type": "object"},
        "status": {"type": "string"},
        "confirmed_at": {"type": "string", "format": "date-time"},
        "confirmed_by": {"type": "string", "format": "uuid"}
    }
}

async def handler(req, context):
    """Handle confirm field request."""
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
    field_id_str = path_params.get("field_id")
    
    if not dossier_id_str or not field_id_str:
        return {"status": 400, "body": {"detail": "dossier_id and field_id are required"}}
    
    try:
        dossier_id = UUID(dossier_id_str)
        field_id = UUID(field_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid UUID format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.VALIDATOR, UserRole.ADMINISTRATOR])
            
            # Verify dossier exists
            dossier_result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = dossier_result.scalar_one_or_none()
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            # Get field
            field_result = await db.execute(
                select(ExtractedField).where(
                    ExtractedField.id == field_id,
                    ExtractedField.dossier_id == dossier_id
                )
            )
            field = field_result.scalar_one_or_none()
            if not field:
                return {"status": 404, "body": {"detail": "Field not found"}}
            
            # Confirm field
            field.status = FieldStatus.CONFIRMED
            field.confirmed_at = datetime.utcnow()
            field.confirmed_by = current_user.id
            await db.commit()
            await db.refresh(field)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="field.confirmed",
                    entity_type="extracted_field",
                    entity_id=str(field.id),
                    description=f"Field {field.field_name} confirmed in dossier {dossier.reference}"
                )
            except Exception:
                pass
            
            return {
                "status": 200,
                "body": {
                    "id": str(field.id),
                    "field_name": field.field_name,
                    "display_name": field.display_name,
                    "extracted_value": field.extracted_value,
                    "corrected_value": field.corrected_value,
                    "status": field.status.value if hasattr(field.status, "value") else str(field.status),
                    "confirmed_at": field.confirmed_at.isoformat() if field.confirmed_at else None,
                    "confirmed_by": str(field.confirmed_by) if field.confirmed_by else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error confirming field: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

