"""Create dossier endpoint step."""
from datetime import datetime
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier, DossierStatus
from app.models.installer import Installer
from app.models.process import Process
from app.schemas.dossier import DossierCreate
from app.services.activity import ActivityLogger
from sqlalchemy import select, func

config = {
    "name": "CreateDossier",
    "type": "api",
    "path": "/api/dossiers",
    "method": "POST",
    "bodySchema": {
        "process_id": {"type": "string", "format": "uuid"},
        "installer_id": {"type": "string", "format": "uuid"},
        "priority": {"type": "string", "enum": ["low", "normal", "high", "urgent"]},
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
            },
            "required": ["name", "address", "city", "postal_code"]
        }
    }
}

async def handler(req, context):
    """Handle create dossier request."""
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
    body = req.get("body", {})
    
    # Get database session
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            # Authenticate user
            current_user = await get_current_user_from_token(token, db)
            
            # Parse request body
            dossier_data = DossierCreate(**body)
            
            # Verify process exists
            process_result = await db.execute(
                select(Process).where(Process.id == dossier_data.process_id)
            )
            process = process_result.scalar_one_or_none()
            if not process:
                return {
                    "status": 404,
                    "body": {"detail": "Process not found"}
                }
            
            # Verify installer exists
            installer_result = await db.execute(
                select(Installer).where(Installer.id == dossier_data.installer_id)
            )
            installer = installer_result.scalar_one_or_none()
            if not installer:
                return {
                    "status": 404,
                    "body": {"detail": "Installer not found"}
                }
            
            # If user is an installer, they can only create dossiers for themselves
            if current_user.role == UserRole.INSTALLER:
                installer_user_result = await db.execute(
                    select(Installer).where(Installer.user_id == current_user.id)
                )
                installer_user = installer_user_result.scalar_one_or_none()
                
                if not installer_user or installer_user.id != dossier_data.installer_id:
                    return {
                        "status": 403,
                        "body": {"detail": "You can only create dossiers for your own installer account"}
                    }
            
            # Generate reference
            count_result = await db.execute(select(func.count(Dossier.id)))
            count = count_result.scalar() or 0
            reference = f"DOS-{datetime.now().year}-{count + 1:06d}"
            
            # Create dossier
            dossier = Dossier(
                reference=reference,
                process_id=dossier_data.process_id,
                installer_id=dossier_data.installer_id,
                status=DossierStatus.DRAFT,
                priority=dossier_data.priority,
                beneficiary_name=dossier_data.beneficiary.name,
                beneficiary_address=dossier_data.beneficiary.address,
                beneficiary_city=dossier_data.beneficiary.city,
                beneficiary_postal_code=dossier_data.beneficiary.postal_code,
                beneficiary_email=dossier_data.beneficiary.email,
                beneficiary_phone=dossier_data.beneficiary.phone,
                precarity_status=dossier_data.beneficiary.precarity_status
            )
            
            db.add(dossier)
            await db.commit()
            await db.refresh(dossier)
            
            # Log activity
            logger = ActivityLogger(db)
            await logger.log(
                user_id=str(current_user.id),
                action_type="dossier.created",
                entity_type="dossier",
                entity_id=str(dossier.id),
                entity_reference=dossier.reference,
                description=f"Dossier {dossier.reference} created"
            )
            
            return {
                "status": 201,
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
                    "created_at": dossier.created_at.isoformat() if dossier.created_at else None
                }
            }
        except ValueError as e:
            return {
                "status": 401,
                "body": {"detail": str(e)},
                "headers": {"WWW-Authenticate": "Bearer"}
            }
        except Exception as e:
            context.logger.error(f"Error creating dossier: {e}", exc_info=True)
            return {
                "status": 500,
                "body": {"detail": "Internal server error"}
            }

