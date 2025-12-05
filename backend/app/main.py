"""Motia application main entry point."""
import asyncio
import logging
from aiohttp import web
from app.motia_server import app
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

if __name__ == "__main__":
    web.run_app(app, host="0.0.0.0", port=settings.PORT)

__all__ = ["app"]

