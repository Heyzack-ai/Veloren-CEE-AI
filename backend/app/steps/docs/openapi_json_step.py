"""OpenAPI JSON specification endpoint step."""
from app.motia_server import STEPS
import json

config = {
    "name": "OpenAPIJSON",
    "type": "api",
    "path": "/api/openapi.json",
    "method": "GET"
}

def generate_openapi_spec():
    """Generate OpenAPI 3.0 specification from registered steps."""
    paths = {}
    tags = set()
    
    for step_key, step_info in STEPS.items():
        config = step_info["config"]
        if config.get("type") != "api":
            continue
        
        path = config.get("path", "/")
        method = config.get("method", "GET").lower()
        name = config.get("name", "Unknown")
        body_schema = config.get("bodySchema", {})
        
        # Extract tag from path (e.g., /api/auth/login -> auth)
        path_parts = path.split("/")
        if len(path_parts) > 2 and path_parts[1] == "api":
            tag = path_parts[2].title() if len(path_parts) > 2 else "General"
            tags.add(tag)
        else:
            tag = "General"
            tags.add(tag)
        
        # Convert path parameters
        openapi_path = path
        path_params = []
        if "{" in path:
            import re
            param_pattern = re.compile(r'\{(\w+)\}')
            matches = param_pattern.findall(path)
            for param in matches:
                openapi_path = openapi_path.replace(f"{{{param}}}", f"{{{param}}}")
                path_params.append({
                    "name": param,
                    "in": "path",
                    "required": True,
                    "schema": {"type": "string", "format": "uuid"}
                })
        
        if openapi_path not in paths:
            paths[openapi_path] = {}
        
        operation = {
            "operationId": name,
            "summary": name.replace("_", " ").title(),
            "tags": [tag],
            "responses": {
                "200": {
                    "description": "Success",
                    "content": {
                        "application/json": {
                            "schema": {"type": "object"}
                        }
                    }
                },
                "401": {
                    "description": "Unauthorized"
                },
                "404": {
                    "description": "Not found"
                },
                "500": {
                    "description": "Internal server error"
                }
            }
        }
        
        # Add path parameters
        if path_params:
            operation["parameters"] = path_params
        
        # Add request body for POST/PUT/PATCH
        if method in ["post", "put", "patch"]:
            if body_schema:
                operation["requestBody"] = {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": _convert_schema(body_schema)
                            }
                        }
                    }
                }
            else:
                operation["requestBody"] = {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"type": "object"}
                        }
                    }
                }
        
        # Add security
        if path not in ["/api/auth/login", "/", "/health"]:
            operation["security"] = [{"bearerAuth": []}]
        
        paths[openapi_path][method] = operation
    
    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "CEE Validation System API (Motia)",
            "description": "CEE (Certificat d'Économie d'Énergie) Document Validation System - Motia Edition",
            "version": "2.0.0"
        },
        "servers": [
            {
                "url": "http://localhost:8000",
                "description": "Development server"
            }
        ],
        "tags": [{"name": tag} for tag in sorted(tags)],
        "paths": paths,
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        }
    }
    
    return spec

def _convert_schema(schema):
    """Convert Motia bodySchema to OpenAPI schema."""
    if isinstance(schema, dict):
        result = {}
        for key, value in schema.items():
            if isinstance(value, dict):
                if "type" in value:
                    result[key] = {
                        "type": value["type"],
                        "format": value.get("format"),
                        "enum": value.get("enum"),
                        "minLength": value.get("minLength"),
                        "maximum": value.get("maximum"),
                        "minimum": value.get("minimum")
                    }
                elif "properties" in value:
                    result[key] = {
                        "type": "object",
                        "properties": _convert_schema(value.get("properties", {}))
                    }
                else:
                    result[key] = _convert_schema(value)
            else:
                result[key] = {"type": "string"}
        return result
    return schema

async def handler(req, context):
    """Handle OpenAPI JSON request."""
    spec = generate_openapi_spec()
    return {
        "status": 200,
        "body": spec
        # Note: Content-Type is automatically set by web.json_response
    }

