"""Document management endpoints."""
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/dossiers", tags=["documents"])


@router.post("/{dossier_id}/documents")
async def upload_document(
    dossier_id: UUID,
    file: UploadFile = File(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """Upload document(s) to dossier."""
    # TODO: Implement document upload
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{dossier_id}/documents")
async def list_documents(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """List dossier documents."""
    # TODO: Implement document listing
    return {"documents": []}


@router.get("/documents/{document_id}")
async def get_document(
    document_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """Get document details."""
    # TODO: Implement document retrieval
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """Download document file."""
    # TODO: Implement document download
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/documents/{document_id}/reprocess")
async def reprocess_document(
    document_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR, UserRole.VALIDATOR]))] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """Reprocess document."""
    # TODO: Implement document reprocessing
    raise HTTPException(status_code=501, detail="Not implemented")

