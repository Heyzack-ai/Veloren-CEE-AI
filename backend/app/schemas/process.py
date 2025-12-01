"""Process schemas."""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ProcessCreate(BaseModel):
    """Process creation schema."""
    code: str
    name: str
    category: str
    description: Optional[str] = None
    version: str
    is_coup_de_pouce: bool = False
    valid_from: date
    valid_until: Optional[date] = None
    required_documents: list[str] = []


class ProcessUpdate(BaseModel):
    """Process update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    valid_until: Optional[date] = None
    required_documents: Optional[list[str]] = None


class ProcessResponse(BaseModel):
    """Process response schema."""
    id: UUID
    code: str
    name: str
    category: str
    description: Optional[str] = None
    version: str
    is_active: bool
    is_coup_de_pouce: bool
    valid_from: date
    valid_until: Optional[date] = None
    required_documents: list[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

