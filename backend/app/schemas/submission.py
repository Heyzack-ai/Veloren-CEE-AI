"""Submission schemas."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
from app.models.submission import SubmissionStatus


class SubmissionCreate(BaseModel):
    """Submission creation schema."""
    document_type_id: int


class SubmissionUpdate(BaseModel):
    """Submission update schema."""
    notes: Optional[str] = None
    status: Optional[SubmissionStatus] = None


class SubmissionFileResponse(BaseModel):
    """Submission file response schema."""
    id: int
    filename: str
    file_size: int
    mime_type: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class SubmissionResponse(BaseModel):
    """Submission response schema."""
    id: int
    document_type_id: int
    installer_id: int
    validator_id: Optional[int]
    status: SubmissionStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    reviewed_at: Optional[datetime]
    files: List[SubmissionFileResponse] = []
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class SubmissionListResponse(BaseModel):
    """Submission list response schema."""
    id: int
    document_type_id: int
    installer_id: int
    validator_id: Optional[int]
    status: SubmissionStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

