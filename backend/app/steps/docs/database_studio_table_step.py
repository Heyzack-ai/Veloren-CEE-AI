"""Database Studio - Table Data Endpoint."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from sqlalchemy import text

config = {
    "name": "DatabaseStudioTable",
    "type": "api",
    "path": "/api/db/studio/table/{table_name}",
    "method": "GET"
}

async def handler(req, context):
    """Handle database studio table data request."""
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
    query = req.get("query", {})
    
    table_name = path_params.get("table_name")
    if not table_name:
        return {"status": 400, "body": {"detail": "table_name is required"}}
    
    page = int(query.get("page", 1))
    page_size = min(int(query.get("page_size", 50)), 1000)
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Sanitize table name (prevent SQL injection)
            if not table_name.replace("_", "").isalnum():
                return {"status": 400, "body": {"detail": "Invalid table name"}}
            
            # Get columns info
            columns_query = text("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = :table_name
                ORDER BY ordinal_position
            """)
            
            columns_result = await db.execute(columns_query, {"table_name": table_name})
            columns_data = columns_result.fetchall()
            
            if not columns_data:
                return {"status": 404, "body": {"detail": "Table not found"}}
            
            # Get primary keys
            pk_query = text("""
                SELECT column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = :table_name
            """)
            
            pk_result = await db.execute(pk_query, {"table_name": table_name})
            primary_keys = {row[0] for row in pk_result.fetchall()}
            
            # Get foreign keys
            fk_query = text("""
                SELECT kcu.column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = :table_name
            """)
            
            fk_result = await db.execute(fk_query, {"table_name": table_name})
            foreign_keys = {row[0] for row in fk_result.fetchall()}
            
            # Build columns info
            columns = []
            for col_row in columns_data:
                columns.append({
                    "name": col_row[0],
                    "type": col_row[1],
                    "nullable": col_row[2] == "YES",
                    "default": col_row[3],
                    "is_pk": col_row[0] in primary_keys,
                    "is_fk": col_row[0] in foreign_keys
                })
            
            # Get total count
            count_query = text(f'SELECT COUNT(*) FROM "{table_name}"')
            count_result = await db.execute(count_query)
            total = count_result.scalar() or 0
            
            # Get paginated data
            offset = (page - 1) * page_size
            column_names = [col["name"] for col in columns]
            select_query = text(f'SELECT * FROM "{table_name}" ORDER BY 1 LIMIT :limit OFFSET :offset')
            
            data_result = await db.execute(select_query, {"limit": page_size, "offset": offset})
            rows_data = data_result.fetchall()
            
            # Convert rows to dictionaries
            rows = []
            for row in rows_data:
                row_dict = {}
                for i, col_name in enumerate(column_names):
                    value = row[i]
                    # Convert UUID and other types to strings for JSON serialization
                    if hasattr(value, '__str__'):
                        row_dict[col_name] = str(value) if value is not None else None
                    else:
                        row_dict[col_name] = value
                rows.append(row_dict)
            
            total_pages = (total + page_size - 1) // page_size
            
            return {
                "status": 200,
                "body": {
                    "table_name": table_name,
                    "columns": columns,
                    "rows": rows,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": total_pages
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error loading table data: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

