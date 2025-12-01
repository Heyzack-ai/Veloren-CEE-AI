"""FastAPI application main entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, dossiers, documents, validation

app = FastAPI(
    title="CEE Validation System API",
    description="CEE (Certificat d'Économie d'Énergie) Document Validation System",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(dossiers.router)
app.include_router(documents.router)
app.include_router(validation.router)

# TODO: Add remaining routers:
# - feedback
# - processes
# - rules
# - schemas
# - users
# - installers
# - billing
# - analytics
# - activity
# - search
# - ai_config


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "CEE Validation System API", "version": "2.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

