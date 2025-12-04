"""Create rule endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validation_rule import ValidationRule
from sqlalchemy import select

config = {
    "name": "CreateRule",
    "type": "api",
    "path": "/api/rules",
    "method": "POST"
}

async def handler(req, context):
    """Handle create rule request."""
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
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            if "code" in body:
                result = await db.execute(select(ValidationRule).where(ValidationRule.code == body["code"]))
                if result.scalar_one_or_none():
                    return {
                        "status": 400,
                        "body": {"detail": "Rule code already exists"}
                    }
            
            rule = ValidationRule(**body, created_by=current_user.id)
            db.add(rule)
            await db.commit()
            await db.refresh(rule)
            
            return {
                "status": 201,
                "body": {
                    "id": str(rule.id),
                    "code": rule.code,
                    "name": rule.name,
                    "is_active": rule.is_active,
                    "created_at": rule.created_at.isoformat() if rule.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error creating rule: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

