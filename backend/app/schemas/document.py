"""Document schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.document import ProcessingStatus


class DocumentResponse(BaseModel):
    """Document response schema."""
    id: UUID
    dossier_id: UUID
    document_type_id: Optional[UUID] = None
    filename: str
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int
    page_count: Optional[int] = None
    processing_status: ProcessingStatus
    classification_confidence: Optional[float] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Document list response schema."""
    documents: list[DocumentResponse]
    total: int

