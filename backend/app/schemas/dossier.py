"""Dossier schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.dossier import DossierStatus, Priority


class Beneficiary(BaseModel):
    """Beneficiary information."""
    name: str
    address: str
    city: str
    postal_code: str
    email: Optional[str] = None
    phone: Optional[str] = None
    precarity_status: Optional[str] = None


class DossierCreate(BaseModel):
    """Dossier creation schema."""
    process_id: UUID
    installer_id: UUID
    beneficiary: Beneficiary
    priority: Priority = Priority.NORMAL


class DossierUpdate(BaseModel):
    """Dossier update schema."""
    status: Optional[DossierStatus] = None
    priority: Optional[Priority] = None
    assigned_validator_id: Optional[UUID] = None
    beneficiary: Optional[Beneficiary] = None


class DossierResponse(BaseModel):
    """Dossier response schema."""
    id: UUID
    reference: str
    process_id: UUID
    installer_id: UUID
    assigned_validator_id: Optional[UUID] = None
    status: DossierStatus
    priority: Priority
    beneficiary_name: str
    beneficiary_address: str
    beneficiary_city: str
    beneficiary_postal_code: str
    beneficiary_email: Optional[str] = None
    beneficiary_phone: Optional[str] = None
    precarity_status: Optional[str] = None
    confidence_score: Optional[float] = None
    submitted_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    validated_by: Optional[UUID] = None
    processing_time_ms: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DossierListResponse(BaseModel):
    """Dossier list response schema."""
    dossiers: list[DossierResponse]
    total: int
    page: int
    limit: int

