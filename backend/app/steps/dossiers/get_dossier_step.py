"""Get dossier endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.dossier import Dossier

config = {
    "name": "GetDossier",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}",
    "method": "GET",
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "reference": {"type": "string"},
        "process_id": {"type": "string", "format": "uuid"},
        "installer_id": {"type": "string", "format": "uuid"},
        "status": {"type": "string"},
        "priority": {"type": "string"},
        "beneficiary_name": {"type": "string"},
        "beneficiary_address": {"type": "string"},
        "beneficiary_city": {"type": "string"},
        "beneficiary_postal_code": {"type": "string"},
        "beneficiary_email": {"type": "string", "format": "email"},
        "beneficiary_phone": {"type": "string"},
        "precarity_status": {"type": "boolean"},
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle get dossier request."""
    # Get authentication token
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
    
    if not dossier_id_str:
        return {
            "status": 400,
            "body": {"detail": "dossier_id is required"}
        }
    
    try:
        dossier_id = UUID(dossier_id_str)
    except ValueError:
        return {
            "status": 400,
            "body": {"detail": "Invalid dossier_id format"}
        }
    
    # Get database session
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            # Authenticate user
            current_user = await get_current_user_from_token(token, db)
            
            # Get dossier
            from sqlalchemy import select
            result = await db.execute(
                select(Dossier).where(Dossier.id == dossier_id)
            )
            dossier = result.scalar_one_or_none()
            
            if not dossier:
                return {
                    "status": 404,
                    "body": {"detail": "Dossier not found"}
                }
            
            return {
                "status": 200,
                "body": {
                    "id": str(dossier.id),
                    "reference": dossier.reference,
                    "process_id": str(dossier.process_id),
                    "installer_id": str(dossier.installer_id),
                    "status": dossier.status.value if hasattr(dossier.status, "value") else str(dossier.status),
                    "priority": dossier.priority.value if hasattr(dossier.priority, "value") else str(dossier.priority),
                    "beneficiary_name": dossier.beneficiary_name,
                    "beneficiary_address": dossier.beneficiary_address,
                    "beneficiary_city": dossier.beneficiary_city,
                    "beneficiary_postal_code": dossier.beneficiary_postal_code,
                    "beneficiary_email": dossier.beneficiary_email,
                    "beneficiary_phone": dossier.beneficiary_phone,
                    "precarity_status": dossier.precarity_status,
                    "created_at": dossier.created_at.isoformat() if dossier.created_at else None,
                    "updated_at": dossier.updated_at.isoformat() if dossier.updated_at else None
                }
            }
        except ValueError as e:
            return {
                "status": 401,
                "body": {"detail": str(e)},
                "headers": {"WWW-Authenticate": "Bearer"}
            }
        except Exception as e:
            context.logger.error(f"Error getting dossier: {e}", exc_info=True)
            return {
                "status": 500,
                "body": {"detail": "Internal server error"}
            }

