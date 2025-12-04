"""Test rule endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validation_rule import ValidationRule
from app.models.dossier import Dossier
from app.services.rules.rule_evaluator import RuleEvaluator
from sqlalchemy import select

config = {
    "name": "TestRule",
    "type": "api",
    "path": "/api/rules/{rule_id}/test",
    "method": "POST",
    "bodySchema": {
        "dossier_id": {"type": "string", "format": "uuid"},
        "test_data": {"type": "object"}
    }
}

async def handler(req, context):
    """Handle test rule request."""
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
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            # Get rule
            rule_result = await db.execute(select(ValidationRule).where(ValidationRule.id == rule_id))
            rule = rule_result.scalar_one_or_none()
            if not rule:
                return {"status": 404, "body": {"detail": "Rule not found"}}
            
            # Get test data
            test_data = body.get("test_data")
            dossier_id = body.get("dossier_id")
            
            if dossier_id:
                try:
                    dossier_uuid = UUID(dossier_id)
                    dossier_result = await db.execute(select(Dossier).where(Dossier.id == dossier_uuid))
                    dossier = dossier_result.scalar_one_or_none()
                    if not dossier:
                        return {"status": 404, "body": {"detail": "Dossier not found"}}
                    # Use dossier data for testing
                    test_data = test_data or {}
                except ValueError:
                    pass
            
            # Evaluate rule
            evaluator = RuleEvaluator()
            result = await evaluator.evaluate(rule, test_data or {})
            
            return {
                "status": 200,
                "body": {
                    "rule_id": str(rule.id),
                    "rule_code": rule.code,
                    "rule_name": rule.name,
                    "passed": result.passed,
                    "status": result.status,
                    "message": result.message
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error testing rule: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

