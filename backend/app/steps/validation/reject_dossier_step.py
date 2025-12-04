"""Reject dossier endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier, DossierStatus
from app.services.activity import ActivityLogger
from sqlalchemy import select

config = {
    "name": "RejectDossier",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/reject",
    "method": "POST",
    "bodySchema": {
        "reason": {"type": "string", "required": True}
    }
}

async def handler(req, context):
    """Handle reject dossier request."""
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
            current_user = await require_role_from_user(current_user, [UserRole.VALIDATOR])
            
            result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = result.scalar_one_or_none()
            
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            # TODO: Implement dossier rejection logic
            dossier.status = DossierStatus.REJECTED
            if "reason" in body:
                # Store rejection reason if field exists
                pass
            
            await db.commit()
            await db.refresh(dossier)
            
            logger = ActivityLogger(db)
            await logger.log(
                user_id=str(current_user.id),
                action_type="dossier.rejected",
                entity_type="dossier",
                entity_id=str(dossier.id),
                entity_reference=dossier.reference,
                description=f"Dossier {dossier.reference} rejected"
            )
            
            return {
                "status": 200,
                "body": {
                    "id": str(dossier.id),
                    "reference": dossier.reference,
                    "status": dossier.status.value if hasattr(dossier.status, "value") else str(dossier.status)
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error rejecting dossier: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

