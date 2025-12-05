"""Database schema visualization endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession

config = {
    "name": "DatabaseSchema",
    "type": "api",
    "path": "/api/docs/database-schema",
    "method": "GET"
}

async def handler(req, context):
    """Handle database schema visualization request."""
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
    format_type = query.get("format", "json")  # json or html
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get all tables
            tables_query = text("""
                SELECT 
                    table_name,
                    table_schema
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            
            result = await db.execute(tables_query)
            tables_data = result.fetchall()
            
            schema_info = {
                "tables": [],
                "relationships": []
            }
            
            # For each table, get columns and constraints
            for table_row in tables_data:
                table_name = table_row[0]
                
                # Get columns
                columns_query = text("""
                    SELECT 
                        column_name,
                        data_type,
                        character_maximum_length,
                        is_nullable,
                        column_default,
                        udt_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = :table_name
                    ORDER BY ordinal_position
                """)
                
                columns_result = await db.execute(columns_query, {"table_name": table_name})
                columns_data = columns_result.fetchall()
                
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
                primary_keys = [row[0] for row in pk_result.fetchall()]
                
                # Get foreign keys
                fk_query = text("""
                    SELECT
                        kcu.column_name,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name,
                        tc.constraint_name
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'public'
                    AND tc.table_name = :table_name
                """)
                
                fk_result = await db.execute(fk_query, {"table_name": table_name})
                foreign_keys = []
                for fk_row in fk_result.fetchall():
                    foreign_keys.append({
                        "column": fk_row[0],
                        "references_table": fk_row[1],
                        "references_column": fk_row[2],
                        "constraint_name": fk_row[3]
                    })
                    
                    # Add to relationships
                    schema_info["relationships"].append({
                        "from_table": table_name,
                        "from_column": fk_row[0],
                        "to_table": fk_row[1],
                        "to_column": fk_row[2],
                        "constraint_name": fk_row[3]
                    })
                
                # Get indexes
                index_query = text("""
                    SELECT
                        indexname,
                        indexdef
                    FROM pg_indexes
                    WHERE schemaname = 'public'
                    AND tablename = :table_name
                """)
                
                index_result = await db.execute(index_query, {"table_name": table_name})
                indexes = [{"name": row[0], "definition": row[1]} for row in index_result.fetchall()]
                
                # Build columns info
                columns = []
                for col_row in columns_data:
                    col_info = {
                        "name": col_row[0],
                        "type": col_row[1],
                        "udt_name": col_row[5],  # PostgreSQL specific type
                        "max_length": col_row[2],
                        "nullable": col_row[3] == "YES",
                        "default": col_row[4],
                        "is_primary_key": col_row[0] in primary_keys,
                        "is_foreign_key": any(fk["column"] == col_row[0] for fk in foreign_keys)
                    }
                    
                    # Add foreign key reference if exists
                    fk_ref = next((fk for fk in foreign_keys if fk["column"] == col_row[0]), None)
                    if fk_ref:
                        col_info["foreign_key"] = {
                            "references_table": fk_ref["references_table"],
                            "references_column": fk_ref["references_column"]
                        }
                    
                    columns.append(col_info)
                
                table_info = {
                    "name": table_name,
                    "columns": columns,
                    "primary_keys": primary_keys,
                    "foreign_keys": foreign_keys,
                    "indexes": indexes,
                    "column_count": len(columns)
                }
                
                schema_info["tables"].append(table_info)
            
            # Remove duplicate relationships
            seen = set()
            unique_relationships = []
            for rel in schema_info["relationships"]:
                key = (rel["from_table"], rel["from_column"], rel["to_table"], rel["to_column"])
                if key not in seen:
                    seen.add(key)
                    unique_relationships.append(rel)
            schema_info["relationships"] = unique_relationships
            
            # Generate HTML visualization if requested
            if format_type == "html":
                html = _generate_html_visualization(schema_info)
                return {
                    "status": 200,
                    "body": html,
                    "headers": {"Content-Type": "text/html"}
                }
            
            return {
                "status": 200,
                "body": schema_info
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting database schema: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}


def _generate_html_visualization(schema_info):
    """Generate HTML visualization of database schema."""
    html = """<!DOCTYPE html>
<html>
<head>
    <title>Database Schema Visualization</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .stats {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table-name {
            font-size: 24px;
            font-weight: bold;
            color: #2196F3;
            margin-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        .columns {
            display: grid;
            gap: 10px;
        }
        .column {
            padding: 12px;
            background: #f9f9f9;
            border-left: 4px solid #4CAF50;
            border-radius: 4px;
        }
        .column-name {
            font-weight: bold;
            color: #333;
            font-size: 16px;
        }
        .column-type {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .column-meta {
            margin-top: 8px;
            font-size: 12px;
            color: #999;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            margin-right: 5px;
        }
        .badge-pk {
            background: #FF9800;
            color: white;
        }
        .badge-fk {
            background: #9C27B0;
            color: white;
        }
        .badge-nullable {
            background: #E0E0E0;
            color: #666;
        }
        .badge-not-null {
            background: #F44336;
            color: white;
        }
        .relationships {
            margin-top: 30px;
        }
        .relationship {
            padding: 10px;
            background: #E3F2FD;
            border-left: 4px solid #2196F3;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .indexes {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }
        .index {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗄️ Database Schema Visualization</h1>
        
        <div class="stats">
            <strong>Total Tables:</strong> {table_count} | 
            <strong>Total Relationships:</strong> {relationship_count}
        </div>
"""
    
    # Add tables
    for table in schema_info["tables"]:
        html += f"""
        <div class="table-card">
            <div class="table-name">📋 {table['name']}</div>
            <div class="columns">
"""
        for col in table["columns"]:
            badges = []
            if col["is_primary_key"]:
                badges.append('<span class="badge badge-pk">PK</span>')
            if col["is_foreign_key"]:
                badges.append('<span class="badge badge-fk">FK</span>')
            if col["nullable"]:
                badges.append('<span class="badge badge-nullable">NULL</span>')
            else:
                badges.append('<span class="badge badge-not-null">NOT NULL</span>')
            
            fk_info = ""
            if col.get("foreign_key"):
                fk = col["foreign_key"]
                fk_info = f'<div class="column-meta">→ References: <strong>{fk["references_table"]}.{fk["references_column"]}</strong></div>'
            
            default_info = ""
            if col.get("default"):
                default_info = f'<div class="column-meta">Default: <code>{col["default"]}</code></div>'
            
            html += f"""
                <div class="column">
                    <div class="column-name">{col['name']} {' '.join(badges)}</div>
                    <div class="column-type"><code>{col['type']}</code> {f"({col['udt_name']})" if col.get('udt_name') and col['udt_name'] != col['type'] else ""}</div>
                    {fk_info}
                    {default_info}
                </div>
"""
        
        html += """
            </div>
"""
        
        # Add indexes if any
        if table.get("indexes"):
            html += '<div class="indexes"><strong>Indexes:</strong>'
            for idx in table["indexes"]:
                html += f'<div class="index">{idx["name"]}</div>'
            html += '</div>'
        
        html += """
        </div>
"""
    
    # Add relationships section
    if schema_info.get("relationships"):
        html += """
        <div class="relationships">
            <h2>🔗 Relationships</h2>
"""
        for rel in schema_info["relationships"]:
            html += f"""
            <div class="relationship">
                <strong>{rel['from_table']}.{rel['from_column']}</strong> 
                → 
                <strong>{rel['to_table']}.{rel['to_column']}</strong>
            </div>
"""
        html += """
        </div>
"""
    
    html += """
    </div>
</body>
</html>
"""
    
    return html.format(
        table_count=len(schema_info["tables"]),
        relationship_count=len(schema_info.get("relationships", []))
    )

