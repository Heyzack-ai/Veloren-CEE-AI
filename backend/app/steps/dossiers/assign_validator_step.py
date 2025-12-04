"""Assign validator to dossier endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import User, UserRole
from app.models.dossier import Dossier, DossierStatus
from app.services.activity import ActivityLogger
from sqlalchemy import select

config = {
    "name": "AssignValidator",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/assign",
    "method": "POST",
    "bodySchema": {
        "validator_id": {"type": "string", "format": "uuid", "required": True}
    }
}

async def handler(req, context):
    """Handle assign validator request."""
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
    validator_id_str = body.get("validator_id")
    
    if not dossier_id_str:
        return {"status": 400, "body": {"detail": "dossier_id is required"}}
    if not validator_id_str:
        return {"status": 400, "body": {"detail": "validator_id is required"}}
    
    try:
        dossier_id = UUID(dossier_id_str)
        validator_id = UUID(validator_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid UUID format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            dossier_result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = dossier_result.scalar_one_or_none()
            
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            validator_result = await db.execute(
                select(User).where(User.id == validator_id).where(User.role == UserRole.VALIDATOR)
            )
            validator = validator_result.scalar_one_or_none()
            
            if not validator:
                return {"status": 404, "body": {"detail": "Validator not found"}}
            
            dossier.assigned_validator_id = validator_id
            if dossier.status == DossierStatus.SUBMITTED:
                dossier.status = DossierStatus.AWAITING_REVIEW
            
            await db.commit()
            await db.refresh(dossier)
            
            logger = ActivityLogger(db)
            await logger.log(
                user_id=str(current_user.id),
                action_type="dossier.assigned",
                entity_type="dossier",
                entity_id=str(dossier.id),
                entity_reference=dossier.reference,
                description=f"Dossier {dossier.reference} assigned to validator"
            )
            
            return {
                "status": 200,
                "body": {
                    "id": str(dossier.id),
                    "reference": dossier.reference,
                    "assigned_validator_id": str(dossier.assigned_validator_id),
                    "status": dossier.status.value if hasattr(dossier.status, "value") else str(dossier.status)
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error assigning validator: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

