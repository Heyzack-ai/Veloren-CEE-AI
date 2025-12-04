"""List schemas endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.field_schema import FieldSchema
from sqlalchemy import select

config = {
    "name": "ListSchemas",
    "type": "api",
    "path": "/api/schemas",
    "method": "GET"
}

async def handler(req, context):
    """Handle list schemas request."""
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
    
    document_type_id_str = query.get("document_type_id")
    is_active_str = query.get("is_active")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            query_obj = select(FieldSchema)
            
            if document_type_id_str:
                try:
                    query_obj = query_obj.where(FieldSchema.document_type_id == UUID(document_type_id_str))
                except ValueError:
                    pass
            if is_active_str is not None:
                query_obj = query_obj.where(FieldSchema.is_active == (is_active_str.lower() == "true"))
            
            query_obj = query_obj.order_by(FieldSchema.display_order, FieldSchema.field_name)
            result = await db.execute(query_obj)
            schemas = result.scalars().all()
            
            return {
                "status": 200,
                "body": [
                    {
                        "id": str(s.id),
                        "field_name": s.field_name,
                        "document_type_id": str(s.document_type_id) if s.document_type_id else None,
                        "is_active": s.is_active,
                        "display_order": s.display_order,
                        "created_at": s.created_at.isoformat() if s.created_at else None
                    }
                    for s in schemas
                ]
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing schemas: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

