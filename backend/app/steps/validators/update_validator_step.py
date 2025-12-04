"""Update validator endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validator import Validator
from sqlalchemy import select

config = {
    "name": "UpdateValidator",
    "type": "api",
    "path": "/api/validators/{validator_id}",
    "method": "PATCH",
    "bodySchema": {
        "employee_id": {"type": "string"},
        "department": {"type": "string"},
        "specialization": {"type": "string"},
        "certifications": {"type": "array"},
        "max_concurrent_dossiers": {"type": "string"},
        "validation_stats": {"type": "object"},
        "notes": {"type": "string"},
        "active": {"type": "boolean"}
    }
}

async def handler(req, context):
    """Handle update validator request."""
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
    validator_id = path_params.get("validator_id")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            result = await db.execute(select(Validator).where(Validator.id == validator_id))
            validator = result.scalar_one_or_none()
            
            if not validator:
                return {"status": 404, "body": {"detail": "Validator not found"}}
            
            # Update fields
            if "employee_id" in body:
                validator.employee_id = body["employee_id"]
            if "department" in body:
                validator.department = body["department"]
            if "specialization" in body:
                validator.specialization = body["specialization"]
            if "certifications" in body:
                validator.certifications = body["certifications"]
            if "max_concurrent_dossiers" in body:
                validator.max_concurrent_dossiers = body["max_concurrent_dossiers"]
            if "validation_stats" in body:
                validator.validation_stats = body["validation_stats"]
            if "notes" in body:
                validator.notes = body["notes"]
            if "active" in body:
                validator.active = body["active"]
            
            await db.commit()
            await db.refresh(validator)
            
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
                    "updated_at": validator.updated_at.isoformat() if validator.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating validator: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

