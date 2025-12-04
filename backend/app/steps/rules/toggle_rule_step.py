"""Toggle rule endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validation_rule import ValidationRule
from sqlalchemy import select

config = {
    "name": "ToggleRule",
    "type": "api",
    "path": "/api/rules/{rule_id}/toggle",
    "method": "POST"
}

async def handler(req, context):
    """Handle toggle rule request."""
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
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get rule
            rule_result = await db.execute(select(ValidationRule).where(ValidationRule.id == rule_id))
            rule = rule_result.scalar_one_or_none()
            if not rule:
                return {"status": 404, "body": {"detail": "Rule not found"}}
            
            # Toggle active status
            rule.is_active = not rule.is_active
            await db.commit()
            await db.refresh(rule)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="rule.toggled",
                    entity_type="validation_rule",
                    entity_id=str(rule.id),
                    description=f"Rule {rule.code} {'activated' if rule.is_active else 'deactivated'}"
                )
            except Exception:
                pass
            
            return {
                "status": 200,
                "body": {
                    "id": str(rule.id),
                    "code": rule.code,
                    "name": rule.name,
                    "is_active": rule.is_active
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error toggling rule: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

