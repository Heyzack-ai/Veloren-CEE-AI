"""FastAPI application main entry point."""
import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.api import (
    auth, dossiers, documents, validation, processes, installers, users,
    billing, analytics, activity, search, rules, schemas, feedback, ai_config
)
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Always use INFO level to see startup messages
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CEE Validation System API",
    description="CEE (Certificat d'Économie d'Énergie) Document Validation System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(auth.router)
app.include_router(dossiers.router)
app.include_router(documents.router)
app.include_router(validation.router)
app.include_router(processes.router)
app.include_router(installers.router)
app.include_router(users.router)
app.include_router(billing.router)
app.include_router(analytics.router)
app.include_router(activity.router)
app.include_router(search.router)
app.include_router(rules.router)
app.include_router(schemas.router)
app.include_router(feedback.router)
app.include_router(ai_config.router)


@app.on_event("startup")
async def startup_event():
    """Log application startup information."""
    # Get DATABASE_URL directly from environment variable (not from .env file)
    env_db_url = os.environ.get("DATABASE_URL", "NOT SET IN ENVIRONMENT")
    settings_db_url = settings.DATABASE_URL
    
    # Use both print and logger to ensure it shows in all environments
    startup_msg = f"""
{'=' * 80}
CEE Validation System API - Starting up
{'=' * 80}
DATABASE_URL from environment: {env_db_url}
DATABASE_URL from settings: {settings_db_url}
Environment: {settings.ENVIRONMENT}
Debug Mode: {settings.DEBUG}
{'=' * 80}
"""
    print(startup_msg)  # Always print to stdout
    logger.info(startup_msg.strip())  # Also log it


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "CEE Validation System API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0"
    }

