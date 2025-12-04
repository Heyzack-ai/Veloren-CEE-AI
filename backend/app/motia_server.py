"""Pure Python Motia server (no FastAPI)."""
import asyncio
import importlib
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from urllib.parse import parse_qs, urlparse
import re
from aiohttp import web
from aiohttp.web import Request, Response
try:
    from aiohttp_cors import setup as cors_setup, ResourceOptions
except ImportError:
    # Fallback if aiohttp-cors is not available
    cors_setup = None
    ResourceOptions = None
from app.core.config import settings

logger = logging.getLogger(__name__)

# Step registry
STEPS: Dict[str, Dict[str, Any]] = {}


def discover_steps():
    """Discover all Motia steps in the steps directory."""
    steps_dir = Path(__file__).parent.parent / "steps"
    
    if not steps_dir.exists():
        logger.warning(f"Steps directory not found: {steps_dir}")
        return
    
    # Walk through all Python files in steps directory
    for py_file in steps_dir.rglob("*.py"):
        if py_file.name == "__init__.py":
            continue
        
        # Convert file path to module path
        relative_path = py_file.relative_to(steps_dir.parent)
        module_path = str(relative_path).replace("/", ".").replace("\\", ".").replace(".py", "")
        
        try:
            module = importlib.import_module(module_path)
            
            # Check if module has config and handler
            if hasattr(module, "config") and hasattr(module, "handler"):
                config = module.config
                handler = module.handler
                
                # Validate config
                if not isinstance(config, dict):
                    logger.warning(f"Invalid config in {module_path}: config must be a dict")
                    continue
                
                if "name" not in config or "type" not in config:
                    logger.warning(f"Invalid config in {module_path}: missing 'name' or 'type'")
                    continue
                
                # Register step
                path = config.get("path", "/")
                method = config.get("method", "GET").upper()
                step_key = f"{method}:{path}"
                STEPS[step_key] = {
                    "config": config,
                    "handler": handler,
                    "module": module_path,
                    "path_pattern": _path_to_regex(path)
                }
                
                logger.info(f"Registered step: {config.get('name')} at {step_key}")
        except Exception as e:
            logger.error(f"Error loading step from {module_path}: {e}", exc_info=True)


def _path_to_regex(path: str):
    """Convert Motia path pattern to regex and extract parameter names."""
    # Convert /api/dossiers/{dossier_id} to regex
    param_names = []
    pattern = path
    
    # Find all {param} patterns
    param_pattern = re.compile(r'\{(\w+)\}')
    matches = param_pattern.findall(path)
    param_names = matches
    
    # Replace {param} with regex groups
    pattern = param_pattern.sub(r'([^/]+)', pattern)
    pattern = f"^{pattern}$"
    
    return (re.compile(pattern), param_names)


def _match_path(path_pattern: re.Pattern, path: str) -> Optional[Dict[str, str]]:
    """Match a path against a pattern and extract parameters."""
    match = path_pattern.match(path)
    if not match:
        return None
    
    return match.groups()


async def _extract_request_data(request: Request) -> Dict[str, Any]:
    """Extract all data from aiohttp request into Motia format."""
    # Parse query parameters
    query = {}
    for key, values in request.query.items():
        if len(values) == 1:
            query[key] = values[0]
        else:
            query[key] = values
    
    # Parse path parameters (will be filled by route matching)
    path_params = {}
    
    # Parse body for POST/PUT/PATCH
    body = {}
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            if request.content_type == "application/json":
                body = await request.json()
            elif request.content_type and "multipart/form-data" in request.content_type:
                # Handle multipart form data
                try:
                    reader = await request.multipart()
                    body = {}
                    async for part in reader:
                        if part.filename:
                            # File upload
                            content = await part.read()
                            body[part.name or "file"] = {
                                "filename": part.filename,
                                "content": content,
                                "content_type": part.content_type
                            }
                        else:
                            # Regular field
                            field_value = await part.text()
                            body[part.name] = field_value
                except Exception as e:
                    logger.warning(f"Error parsing multipart: {e}")
                    body = {}
            else:
                # Try to parse as form data
                try:
                    body = await request.post()
                    body = dict(body)
                except:
                    body = {}
        except Exception as e:
            logger.warning(f"Error parsing request body: {e}")
            body = {}
    
    # Get headers
    headers = dict(request.headers)
    
    return {
        "method": request.method,
        "path": request.path,
        "query": query,
        "headers": headers,
        "body": body,
        "pathParams": path_params
    }


async def _handle_request(request: Request) -> Response:
    """Handle HTTP request and route to appropriate Motia step."""
    # Handle CORS preflight requests
    if request.method == "OPTIONS":
        return web.Response(
            status=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )
    
    method = request.method
    path = request.path
    
    # Find matching step
    matched_step = None
    path_params = {}
    
    for step_key, step_info in STEPS.items():
        step_method, step_path = step_key.split(":", 1)
        
        if step_method != method:
            continue
        
        # Try exact match first
        if step_path == path:
            matched_step = step_info
            break
        
        # Try pattern match
        pattern, param_names = step_info["path_pattern"]
        match_result = _match_path(pattern, path)
        if match_result:
            matched_step = step_info
            path_params = {name: value for name, value in zip(param_names, match_result)}
            break
    
    if not matched_step:
        # Add CORS headers to 404 responses
        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true"
        }
        return web.json_response(
            {"detail": "Not found"},
            status=404,
            headers=cors_headers
        )
    
    # Extract request data
    try:
        motia_req = await _extract_request_data(request)
        motia_req["pathParams"] = path_params
        
        # Create context
        context = type("Context", (), {
            "logger": logger,
            "request": request
        })()
        
        # Call step handler
        result = await matched_step["handler"](motia_req, context)
        
        # Handle response
        status_code = result.get("status", 200)
        response_body = result.get("body", {})
        headers = result.get("headers", {})
        
        # Handle file downloads
        if isinstance(response_body, dict) and "file_content" in response_body:
            file_content = response_body["file_content"]
            content_type = response_body.get("content_type", "application/octet-stream")
            filename = response_body.get("filename", "download")
            
            # Ensure file_content is bytes
            if isinstance(file_content, str):
                file_content = file_content.encode()
            
            # Add CORS headers to file responses
            cors_headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
            headers.update(cors_headers)
            
            response = web.Response(
                body=file_content,
                status=status_code,
                headers={
                    **headers,
                    "Content-Type": content_type,
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )
            return response
        
        # Add CORS headers to all responses
        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true"
        }
        headers.update(cors_headers)
        
        # Handle HTML responses (like Swagger UI)
        if isinstance(response_body, str) and ("<html" in response_body.lower() or "<!doctype" in response_body.lower()):
            return web.Response(
                text=response_body,
                status=status_code,
                headers=headers
            )
        
        # Remove Content-Type from headers if present (web.json_response sets it automatically)
        json_headers = {k: v for k, v in headers.items() if k.lower() != "content-type"}
        
        return web.json_response(
            response_body,
            status=status_code,
            headers=json_headers
        )
    except Exception as e:
        logger.error(f"Error in step handler {matched_step['config'].get('name')}: {e}", exc_info=True)
        return web.json_response(
            {"detail": "Internal server error"},
            status=500
        )


def create_motia_app() -> web.Application:
    """Create aiohttp app with Motia steps."""
    app = web.Application()
    
    # Discover and register steps
    discover_steps()
    
    # Register catch-all route handler
    catch_all_route = app.router.add_route("*", "/{path:.*}", _handle_request)
    
    # Setup CORS if available
    if cors_setup:
        cors = cors_setup(app, defaults={
            "*": ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*"
            )
        })
        
        # Add CORS to all routes except the catch-all (which handles all methods)
        # The catch-all route will handle CORS through the handler itself
        for route in list(app.router.routes()):
            # Skip the catch-all route as it already handles all methods
            if route != catch_all_route:
                try:
                    cors.add(route)
                except ValueError:
                    # Skip routes that can't have CORS added
                    pass
    
    return app


# Create the app
app = create_motia_app()
