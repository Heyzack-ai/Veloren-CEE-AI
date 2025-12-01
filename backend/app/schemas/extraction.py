"""Extraction schemas."""
from datetime import datetime
from pydantic import BaseModel
from typing import Dict, Any, Optional


class ExtractedDataResponse(BaseModel):
    """Extracted data response schema."""
    id: int
    submission_id: int
    file_id: Optional[int]
    extracted_data: Dict[str, Any]
    is_edited: bool
    edited_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class ExtractedDataUpdate(BaseModel):
    """Extracted data update schema."""
    extracted_data: Dict[str, Any]


class ExtractionRunRequest(BaseModel):
    """Extraction run request schema."""
    submission_id: int
    schema_id: int

