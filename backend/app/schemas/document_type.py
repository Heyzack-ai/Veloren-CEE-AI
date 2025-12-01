"""Document type schemas."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class DocumentTypeCreate(BaseModel):
    """Document type creation schema."""
    name: str
    description: Optional[str] = None
    required_pdf_count: int = 1


class DocumentTypeUpdate(BaseModel):
    """Document type update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    required_pdf_count: Optional[int] = None


class DocumentTypeResponse(BaseModel):
    """Document type response schema."""
    id: int
    name: str
    description: Optional[str]
    required_pdf_count: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

