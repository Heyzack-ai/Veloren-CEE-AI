"""List rules endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.validation_rule import ValidationRule
from sqlalchemy import select

config = {
    "name": "ListRules",
    "type": "api",
    "path": "/api/rules",
    "method": "GET"
}

async def handler(req, context):
    """Handle list rules request."""
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
    
    process_id_str = query.get("process_id")
    document_type_id_str = query.get("document_type_id")
    rule_type = query.get("rule_type")
    is_active_str = query.get("is_active")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            query_obj = select(ValidationRule)
            
            if process_id_str:
                try:
                    query_obj = query_obj.where(ValidationRule.process_id == UUID(process_id_str))
                except ValueError:
                    pass
            if document_type_id_str:
                try:
                    query_obj = query_obj.where(ValidationRule.document_type_id == UUID(document_type_id_str))
                except ValueError:
                    pass
            if rule_type:
                query_obj = query_obj.where(ValidationRule.rule_type == rule_type)
            if is_active_str is not None:
                query_obj = query_obj.where(ValidationRule.is_active == (is_active_str.lower() == "true"))
            
            query_obj = query_obj.order_by(ValidationRule.code)
            result = await db.execute(query_obj)
            rules = result.scalars().all()
            
            return {
                "status": 200,
                "body": [
                    {
                        "id": str(r.id),
                        "code": r.code,
                        "name": r.name,
                        "rule_type": r.rule_type,
                        "is_active": r.is_active,
                        "created_at": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in rules
                ]
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing rules: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

