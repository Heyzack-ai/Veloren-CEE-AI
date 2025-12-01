"""Installer schemas."""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class InstallerCreate(BaseModel):
    """Installer creation schema."""
    company_name: str
    siret: str
    siren: str
    address: str
    city: str
    postal_code: str
    contact_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    rge_number: Optional[str] = None
    qualifications: list[str] = []


class InstallerUpdate(BaseModel):
    """Installer update schema."""
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    rge_number: Optional[str] = None
    active: Optional[bool] = None


class InstallerResponse(BaseModel):
    """Installer response schema."""
    id: UUID
    user_id: Optional[UUID] = None
    company_name: str
    siret: str
    siren: str
    address: str
    city: str
    postal_code: str
    contact_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    rge_number: Optional[str] = None
    rge_valid_until: Optional[date] = None
    rge_status: str
    qualifications: list[str]
    contract_reference: Optional[str] = None
    active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

