"""Get schema fields endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token
from app.models.field_schema import FieldSchema
from sqlalchemy import select

config = {
    "name": "GetSchemaFields",
    "type": "api",
    "path": "/api/schemas/{schema_id}/fields",
    "method": "GET"
}

async def handler(req, context):
    """Handle get schema fields request."""
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
            
            # Get fields for this schema (by document_type_id)
            # Note: schema_id here refers to document_type_id or we need to check the schema model
            # For now, assuming schema_id is document_type_id
            fields_result = await db.execute(
                select(FieldSchema).where(
                    FieldSchema.document_type_id == schema_id,
                    FieldSchema.is_active == True
                ).order_by(FieldSchema.display_order)
            )
            fields = fields_result.scalars().all()
            
            fields_list = []
            for field in fields:
                fields_list.append({
                    "id": str(field.id),
                    "field_name": field.field_name,
                    "display_name": field.display_name,
                    "description": field.description,
                    "data_type": field.data_type,
                    "is_required": field.is_required,
                    "validation_pattern": field.validation_pattern,
                    "extraction_hints": field.extraction_hints,
                    "default_value": field.default_value,
                    "display_order": field.display_order,
                    "is_active": field.is_active
                })
            
            return {
                "status": 200,
                "body": {
                    "schema_id": schema_id_str,
                    "fields": fields_list,
                    "total": len(fields_list)
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting schema fields: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

