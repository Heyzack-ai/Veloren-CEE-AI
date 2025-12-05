"""Steps discovery endpoint - shows all registered Motia steps."""
from app.motia_server import STEPS

config = {
    "name": "StepsDiscovery",
    "type": "api",
    "path": "/api/steps",
    "method": "GET"
}

async def handler(req, context):
    """Handle steps discovery request."""
    steps_list = []
    
    for step_key, step_info in STEPS.items():
        config = step_info["config"]
        steps_list.append({
            "name": config.get("name", "Unknown"),
            "type": config.get("type", "api"),
            "path": config.get("path", "/"),
            "method": config.get("method", "GET"),
            "module": step_info.get("module", "unknown")
        })
    
    return {
        "status": 200,
        "body": {
            "total": len(steps_list),
            "steps": sorted(steps_list, key=lambda x: (x["path"], x["method"]))
        }
    }

