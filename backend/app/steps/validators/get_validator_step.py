"""Get validator endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validator import Validator
from sqlalchemy import select

config = {
    "name": "GetValidator",
    "type": "api",
    "path": "/api/validators/{validator_id}",
    "method": "GET"
}

async def handler(req, context):
    """Handle get validator request."""
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
    validator_id = path_params.get("validator_id")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            result = await db.execute(select(Validator).where(Validator.id == validator_id))
            validator = result.scalar_one_or_none()
            
            if not validator:
                return {"status": 404, "body": {"detail": "Validator not found"}}
            
            return {
                "status": 200,
                "body": {
                    "id": str(validator.id),
                    "user_id": str(validator.user_id),
                    "employee_id": validator.employee_id,
                    "department": validator.department,
                    "specialization": validator.specialization,
                    "certifications": validator.certifications or [],
                    "max_concurrent_dossiers": validator.max_concurrent_dossiers,
                    "validation_stats": validator.validation_stats or {},
                    "notes": validator.notes,
                    "active": validator.active,
                    "created_at": validator.created_at.isoformat() if validator.created_at else None,
                    "updated_at": validator.updated_at.isoformat() if validator.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting validator: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

