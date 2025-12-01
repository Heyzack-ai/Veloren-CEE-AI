"""Document management endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.dossier import Dossier
from app.models.document import Document, ProcessingStatus
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.services.pdf_storage import PDFStorageService
from app.services.activity import ActivityLogger

router = APIRouter(prefix="/api/dossiers", tags=["documents"])


@router.post("/{dossier_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    document_type_id: Optional[UUID] = None
):
    """Upload document(s) to dossier."""
    # Verify dossier exists
    dossier_result = await db.execute(
        select(Dossier).where(Dossier.id == dossier_id)
    )
    dossier = dossier_result.scalar_one_or_none()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
    
    # Check file size
    content = await file.read()
    file_size = len(content)
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE} bytes"
        )
    
    # Save file
    storage_service = PDFStorageService()
    # Reset file pointer for storage service
    from io import BytesIO
    file_obj = UploadFile(
        filename=file.filename,
        file=BytesIO(content)
    )
    storage_path, saved_size = await storage_service.save_file(
        file_obj,
        dossier_id
    )
    
    # Create document record
    document = Document(
        dossier_id=dossier_id,
        document_type_id=document_type_id,
        filename=storage_path.split("/")[-1],
        original_filename=file.filename or "unknown",
        storage_path=storage_path,
        mime_type=file.content_type or "application/pdf",
        file_size=saved_size,
        processing_status=ProcessingStatus.PENDING
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    # Log activity
    logger = ActivityLogger(db)
    await logger.log(
        user_id=str(current_user.id),
        action_type="document.uploaded",
        entity_type="document",
        entity_id=str(document.id),
        description=f"Document {file.filename} uploaded to dossier {dossier.reference}"
    )
    
    return document


@router.get("/{dossier_id}/documents", response_model=DocumentListResponse)
async def list_documents(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List dossier documents."""
    # Verify dossier exists
    dossier_result = await db.execute(
        select(Dossier).where(Dossier.id == dossier_id)
    )
    dossier = dossier_result.scalar_one_or_none()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
    
    # Get documents
    result = await db.execute(
        select(Document).where(Document.dossier_id == dossier_id)
        .order_by(Document.uploaded_at.desc())
    )
    documents = result.scalars().all()
    
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in documents],
        total=len(documents)
    )


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get document details."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Download document file."""
    from fastapi.responses import StreamingResponse
    import io
    
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get file content
    storage_service = PDFStorageService()
    content = await storage_service.get_file_content(document.storage_path)
    
    if not content:
        raise HTTPException(status_code=404, detail="File not found in storage")
    
    return StreamingResponse(
        io.BytesIO(content),
        media_type=document.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{document.original_filename}"'}
    )


@router.post("/documents/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    document_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR, UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Reprocess document."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Reset processing status
    document.processing_status = ProcessingStatus.PENDING
    document.processed_at = None
    document.classification_confidence = None
    
    await db.commit()
    await db.refresh(document)
    
    # Log activity
    logger = ActivityLogger(db)
    await logger.log(
        user_id=str(current_user.id),
        action_type="document.reprocessed",
        entity_type="document",
        entity_id=str(document.id),
        description=f"Document {document.filename} marked for reprocessing"
    )
    
    # TODO: Emit event to trigger reprocessing pipeline
    
    return document

