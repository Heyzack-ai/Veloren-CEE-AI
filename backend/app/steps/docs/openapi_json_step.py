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
        response_schema = config.get("responseSchema", {})
        
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
        
        # response_schema is already extracted above
        
        # Determine default status codes based on method
        default_status = "200"
        if method == "post":
            default_status = "201"
        elif method == "delete":
            default_status = "204"
        
        # Build responses
        responses = {}
        
        # Success response
        if response_schema:
            converted_response = _convert_schema(response_schema)
            responses[default_status] = {
                "description": "Success",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": converted_response
                        }
                    }
                }
            }
        else:
            responses[default_status] = {
                "description": "Success",
                "content": {
                    "application/json": {
                        "schema": {"type": "object"}
                    }
                }
            }
        
        # Error responses
        responses["400"] = {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string"}
                        }
                    }
                }
            }
        }
        responses["401"] = {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string"}
                        }
                    }
                }
            }
        }
        responses["403"] = {
            "description": "Forbidden",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string"}
                        }
                    }
                }
            }
        }
        responses["404"] = {
            "description": "Not Found",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string"}
                        }
                    }
                }
            }
        }
        responses["500"] = {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        operation = {
            "operationId": name,
            "summary": name.replace("_", " ").title(),
            "tags": [tag],
            "responses": responses
        }
        
        # Add path parameters
        if path_params:
            operation["parameters"] = path_params
        
        # Add request body for POST/PUT/PATCH
        if method in ["post", "put", "patch"]:
            if body_schema:
                converted_props = _convert_schema(body_schema)
                # Extract required fields from body_schema if specified
                required_fields = []
                if isinstance(body_schema, dict):
                    for key, value in body_schema.items():
                        if isinstance(value, dict) and value.get("required") is True:
                            required_fields.append(key)
                
                request_body_schema = {
                    "type": "object",
                    "properties": converted_props
                }
                
                if required_fields:
                    request_body_schema["required"] = required_fields
                
                operation["requestBody"] = {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": request_body_schema
                        }
                    }
                }
            else:
                operation["requestBody"] = {
                    "required": False,
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
                "url": "https://veloren-dev.heyzack.ai",
                "description": "Production server"
            },
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
                    prop_type = value["type"]
                    
                    # Handle array of types (union types) - use anyOf
                    if isinstance(prop_type, list):
                        result[key] = {
                            "anyOf": [
                                {"type": t} if isinstance(t, str) else {"type": "object"}
                                for t in prop_type
                            ]
                        }
                    else:
                        # Single type
                        prop_schema = {"type": prop_type}
                        
                        # Add format if present
                        if "format" in value:
                            prop_schema["format"] = value["format"]
                        
                        # Add enum if present (must be array)
                        if "enum" in value:
                            enum_val = value["enum"]
                            if isinstance(enum_val, list):
                                prop_schema["enum"] = enum_val
                            elif isinstance(enum_val, str):
                                # If enum is a string, try to parse it or skip
                                pass
                        
                        # Add constraints
                        if "minLength" in value:
                            prop_schema["minLength"] = value["minLength"]
                        if "maxLength" in value:
                            prop_schema["maxLength"] = value["maxLength"]
                        if "minimum" in value:
                            prop_schema["minimum"] = value["minimum"]
                        if "maximum" in value:
                            prop_schema["maximum"] = value["maximum"]
                        if "pattern" in value:
                            prop_schema["pattern"] = value["pattern"]
                        
                        result[key] = prop_schema
                elif "properties" in value:
                    result[key] = {
                        "type": "object",
                        "properties": _convert_schema(value.get("properties", {})),
                        "required": value.get("required", [])
                    }
                else:
                    # Nested object without explicit properties
                    result[key] = _convert_schema(value)
            else:
                # Value is not a dict, treat as string
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

