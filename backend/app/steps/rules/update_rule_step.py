"""Update rule endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validation_rule import ValidationRule
from sqlalchemy import select

config = {
    "name": "UpdateRule",
    "type": "api",
    "path": "/api/rules/{rule_id}",
    "method": "PATCH"
}

async def handler(req, context):
    """Handle update rule request."""
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
    rule_id_str = path_params.get("rule_id")
    body = req.get("body", {})
    
    if not rule_id_str:
        return {"status": 400, "body": {"detail": "rule_id is required"}}
    
    try:
        rule_id = UUID(rule_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid rule_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            result = await db.execute(select(ValidationRule).where(ValidationRule.id == rule_id))
            rule = result.scalar_one_or_none()
            
            if not rule:
                return {"status": 404, "body": {"detail": "Rule not found"}}
            
            if "code" in body and body["code"] != rule.code:
                code_result = await db.execute(
                    select(ValidationRule).where(ValidationRule.code == body["code"]).where(ValidationRule.id != rule_id)
                )
                if code_result.scalar_one_or_none():
                    return {
                        "status": 400,
                        "body": {"detail": "Rule code already exists"}
                    }
            
            for field, value in body.items():
                if hasattr(rule, field):
                    setattr(rule, field, value)
            
            await db.commit()
            await db.refresh(rule)
            
            return {
                "status": 200,
                "body": {
                    "id": str(rule.id),
                    "code": rule.code,
                    "name": rule.name,
                    "is_active": rule.is_active,
                    "updated_at": rule.updated_at.isoformat() if rule.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating rule: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

