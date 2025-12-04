"""List dossiers endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.user import UserRole
from app.models.dossier import Dossier, DossierStatus
from app.models.installer import Installer
from sqlalchemy import select, func, and_

config = {
    "name": "ListDossiers",
    "type": "api",
    "path": "/api/dossiers",
    "method": "GET",
    "responseSchema": {
        "dossiers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "format": "uuid"},
                    "reference": {"type": "string"},
                    "process_id": {"type": "string", "format": "uuid"},
                    "installer_id": {"type": "string", "format": "uuid"},
                    "status": {"type": "string"},
                    "priority": {"type": "string"},
                    "beneficiary_name": {"type": "string"},
                    "created_at": {"type": "string", "format": "date-time"}
                }
            }
        },
        "total": {"type": "integer"},
        "page": {"type": "integer"},
        "limit": {"type": "integer"}
    }
}

async def handler(req, context):
    """Handle list dossiers request."""
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
    query_params = req.get("query", {})
    
    # Parse query parameters
    page = int(query_params.get("page", 1))
    limit = int(query_params.get("limit", 20))
    status_filter = query_params.get("status")
    installer_id = query_params.get("installer_id")
    process_id = query_params.get("process_id")
    assigned_validator_id = query_params.get("assigned_validator_id")
    
    # Get database session
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            # Authenticate user
            current_user = await get_current_user_from_token(token, db)
            
            query = select(Dossier)
            count_query = select(func.count(Dossier.id))
            
            # Apply filters
            filters = []
            if status_filter:
                try:
                    status_enum = DossierStatus(status_filter)
                    filters.append(Dossier.status == status_enum)
                except ValueError:
                    pass
            if installer_id:
                try:
                    filters.append(Dossier.installer_id == UUID(installer_id))
                except ValueError:
                    pass
            if process_id:
                try:
                    filters.append(Dossier.process_id == UUID(process_id))
                except ValueError:
                    pass
            if assigned_validator_id:
                try:
                    filters.append(Dossier.assigned_validator_id == UUID(assigned_validator_id))
                except ValueError:
                    pass
            
            # Role-based filtering
            if current_user.role == UserRole.INSTALLER:
                installer_result = await db.execute(
                    select(Installer).where(Installer.user_id == current_user.id)
                )
                installer = installer_result.scalar_one_or_none()
                if installer:
                    filters.append(Dossier.installer_id == installer.id)
                else:
                    return {
                        "status": 200,
                        "body": {
                            "dossiers": [],
                            "total": 0,
                            "page": page,
                            "limit": limit
                        }
                    }
            
            if filters:
                query = query.where(and_(*filters))
                count_query = count_query.where(and_(*filters))
            
            # Get total count
            total_result = await db.execute(count_query)
            total = total_result.scalar() or 0
            
            # Apply pagination
            query = query.order_by(Dossier.created_at.desc())
            query = query.limit(limit).offset((page - 1) * limit)
            
            result = await db.execute(query)
            dossiers = result.scalars().all()
            
            return {
                "status": 200,
                "body": {
                    "dossiers": [
                        {
                            "id": str(d.id),
                            "reference": d.reference,
                            "process_id": str(d.process_id),
                            "installer_id": str(d.installer_id),
                            "status": d.status.value if hasattr(d.status, "value") else str(d.status),
                            "priority": d.priority.value if hasattr(d.priority, "value") else str(d.priority),
                            "beneficiary_name": d.beneficiary_name,
                            "created_at": d.created_at.isoformat() if d.created_at else None
                        }
                        for d in dossiers
                    ],
                    "total": total,
                    "page": page,
                    "limit": limit
                }
            }
        except ValueError as e:
            return {
                "status": 401,
                "body": {"detail": str(e)},
                "headers": {"WWW-Authenticate": "Bearer"}
            }
        except Exception as e:
            context.logger.error(f"Error listing dossiers: {e}", exc_info=True)
            return {
                "status": 500,
                "body": {"detail": "Internal server error"}
            }

