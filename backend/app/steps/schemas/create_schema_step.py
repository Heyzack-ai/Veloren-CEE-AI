"""Create schema endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.field_schema import FieldSchema

config = {
    "name": "CreateSchema",
    "type": "api",
    "path": "/api/schemas",
    "method": "POST"
}

async def handler(req, context):
    """Handle create schema request."""
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
            
            schema = FieldSchema(**body)
            db.add(schema)
            await db.commit()
            await db.refresh(schema)
            
            return {
                "status": 201,
                "body": {
                    "id": str(schema.id),
                    "field_name": schema.field_name,
                    "document_type_id": str(schema.document_type_id) if schema.document_type_id else None,
                    "is_active": schema.is_active,
                    "created_at": schema.created_at.isoformat() if schema.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error creating schema: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

