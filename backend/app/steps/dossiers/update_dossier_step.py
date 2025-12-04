"""Update dossier endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier
from app.schemas.dossier import DossierUpdate
from app.services.activity import ActivityLogger
from sqlalchemy import select

config = {
    "name": "UpdateDossier",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}",
    "method": "PATCH",
    "bodySchema": {
        "process_id": {"type": "string", "format": "uuid"},
        "installer_id": {"type": "string", "format": "uuid"},
        "priority": {"type": "string", "enum": ["low", "normal", "high", "urgent"]},
        "status": {"type": "string", "enum": ["draft", "submitted", "awaiting_review", "in_review", "approved", "rejected", "archived"]},
        "beneficiary": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "address": {"type": "string"},
                "city": {"type": "string"},
                "postal_code": {"type": "string"},
                "email": {"type": "string", "format": "email"},
                "phone": {"type": "string"},
                "precarity_status": {"type": "boolean"}
            }
        }
    }
}

async def handler(req, context):
    """Handle update dossier request."""
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
    body = req.get("body", {})
    
    if not dossier_id_str:
        return {"status": 400, "body": {"detail": "dossier_id is required"}}
    
    try:
        dossier_id = UUID(dossier_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid dossier_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = result.scalar_one_or_none()
            
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            dossier_data = DossierUpdate(**body)
            update_data = dossier_data.model_dump(exclude_unset=True)
            
            if "beneficiary" in update_data:
                beneficiary = update_data.pop("beneficiary")
                if beneficiary:
                    dossier.beneficiary_name = beneficiary.get("name", dossier.beneficiary_name)
                    dossier.beneficiary_address = beneficiary.get("address", dossier.beneficiary_address)
                    dossier.beneficiary_city = beneficiary.get("city", dossier.beneficiary_city)
                    dossier.beneficiary_postal_code = beneficiary.get("postal_code", dossier.beneficiary_postal_code)
                    dossier.beneficiary_email = beneficiary.get("email", dossier.beneficiary_email)
                    dossier.beneficiary_phone = beneficiary.get("phone", dossier.beneficiary_phone)
                    dossier.precarity_status = beneficiary.get("precarity_status", dossier.precarity_status)
            
            for field, value in update_data.items():
                if hasattr(dossier, field):
                    setattr(dossier, field, value)
            
            await db.commit()
            await db.refresh(dossier)
            
            logger = ActivityLogger(db)
            await logger.log(
                user_id=str(current_user.id),
                action_type="dossier.updated",
                entity_type="dossier",
                entity_id=str(dossier.id),
                entity_reference=dossier.reference,
                description=f"Dossier {dossier.reference} updated"
            )
            
            return {
                "status": 200,
                "body": {
                    "id": str(dossier.id),
                    "reference": dossier.reference,
                    "status": dossier.status.value if hasattr(dossier.status, "value") else str(dossier.status),
                    "updated_at": dossier.updated_at.isoformat() if dossier.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating dossier: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

