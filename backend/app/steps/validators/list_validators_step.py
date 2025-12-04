"""List validators endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validator import Validator
from sqlalchemy import select, func

config = {
    "name": "ListValidators",
    "type": "api",
    "path": "/api/validators",
    "method": "GET"
}

async def handler(req, context):
    """Handle list validators request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    query = req.get("query", {})
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            skip = int(query.get("skip", 0))
            limit = min(int(query.get("limit", 100)), 1000)
            active_only = query.get("active_only", "true").lower() == "true"
            
            query_obj = select(Validator)
            if active_only:
                query_obj = query_obj.where(Validator.active == True)
            
            total_result = await db.execute(select(func.count()).select_from(query_obj.subquery()))
            total = total_result.scalar() or 0
            
            query_obj = query_obj.offset(skip).limit(limit)
            result = await db.execute(query_obj)
            validators = result.scalars().all()
            
            return {
                "status": 200,
                "body": {
                    "items": [
                        {
                            "id": str(v.id),
                            "user_id": str(v.user_id),
                            "employee_id": v.employee_id,
                            "department": v.department,
                            "specialization": v.specialization,
                            "certifications": v.certifications or [],
                            "max_concurrent_dossiers": v.max_concurrent_dossiers,
                            "validation_stats": v.validation_stats or {},
                            "active": v.active,
                            "created_at": v.created_at.isoformat() if v.created_at else None
                        }
                        for v in validators
                    ],
                    "total": total,
                    "skip": skip,
                    "limit": limit
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing validators: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

