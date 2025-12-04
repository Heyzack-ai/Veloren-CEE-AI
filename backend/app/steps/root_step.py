"""Root endpoint step."""
config = {
    "name": "Root",
    "type": "api",
    "path": "/",
    "method": "GET"
}

async def handler(req, context):
    """Handle root request."""
    return {
        "status": 200,
        "body": {
            "message": "CEE Validation System API",
            "version": "2.0.0",
            "docs": "/docs",
            "health": "/health"
        }
    }

