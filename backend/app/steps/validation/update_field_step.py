"""Update extracted field endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.extracted_field import ExtractedField
from app.models.dossier import Dossier
from sqlalchemy import select

config = {
    "name": "UpdateField",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/fields/{field_id}",
    "method": "PATCH",
    "bodySchema": {
        "value": {"type": ["string", "number", "boolean", "object", "array"]}
    },
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "field_name": {"type": "string"},
        "display_name": {"type": "string"},
        "extracted_value": {"type": "object"},
        "corrected_value": {"type": "object"},
        "status": {"type": "string"},
        "updated_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle update field request."""
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
    body = req.get("body", {})
    
    dossier_id_str = path_params.get("dossier_id")
    field_id_str = path_params.get("field_id")
    new_value = body.get("value")
    
    if not dossier_id_str or not field_id_str:
        return {"status": 400, "body": {"detail": "dossier_id and field_id are required"}}
    
    if new_value is None:
        return {"status": 422, "body": {"detail": "value is required"}}
    
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
            
            # Store original value if not already stored
            if field.original_value is None:
                field.original_value = field.extracted_value
            
            # Update field
            field.corrected_value = new_value
            field.status = "corrected"
            await db.commit()
            await db.refresh(field)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="field.updated",
                    entity_type="extracted_field",
                    entity_id=str(field.id),
                    description=f"Field {field.field_name} updated in dossier {dossier.reference}"
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
                    "updated_at": field.updated_at.isoformat() if field.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating field: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

