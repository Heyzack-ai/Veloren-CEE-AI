"""Update schema endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.field_schema import FieldSchema
from sqlalchemy import select

config = {
    "name": "UpdateSchema",
    "type": "api",
    "path": "/api/schemas/{schema_id}",
    "method": "PATCH"
}

async def handler(req, context):
    """Handle update schema request."""
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
    schema_id_str = path_params.get("schema_id")
    body = req.get("body", {})
    
    if not schema_id_str:
        return {"status": 400, "body": {"detail": "schema_id is required"}}
    
    try:
        schema_id = UUID(schema_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid schema_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            result = await db.execute(select(FieldSchema).where(FieldSchema.id == schema_id))
            schema = result.scalar_one_or_none()
            
            if not schema:
                return {"status": 404, "body": {"detail": "Schema not found"}}
            
            for field, value in body.items():
                if hasattr(schema, field):
                    setattr(schema, field, value)
            
            await db.commit()
            await db.refresh(schema)
            
            return {
                "status": 200,
                "body": {
                    "id": str(schema.id),
                    "field_name": schema.field_name,
                    "is_active": schema.is_active,
                    "updated_at": schema.updated_at.isoformat() if schema.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error updating schema: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

