"""Health check endpoint step."""
config = {
    "name": "HealthCheck",
    "type": "api",
    "path": "/health",
    "method": "GET"
}

async def handler(req, context):
    """Handle health check request."""
    return {
        "status": 200,
        "body": {
            "status": "healthy",
            "version": "2.0.0"
        }
    }

