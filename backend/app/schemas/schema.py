"""Schema schemas for extraction configurations."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any


class SchemaCreate(BaseModel):
    """Schema creation schema."""
    name: str
    document_type_id: int
    extraction_config: Dict[str, Any]
    version: int = 1


class SchemaUpdate(BaseModel):
    """Schema update schema."""
    name: Optional[str] = None
    extraction_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class SchemaResponse(BaseModel):
    """Schema response schema."""
    id: int
    name: str
    document_type_id: int
    extraction_config: Dict[str, Any]
    version: int
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

