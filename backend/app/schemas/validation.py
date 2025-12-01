"""Validation schemas."""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel
from app.models.extracted_field import FieldStatus


class ExtractedFieldResponse(BaseModel):
    """Extracted field response schema."""
    id: UUID
    document_id: UUID
    dossier_id: UUID
    field_schema_id: Optional[UUID] = None
    field_name: str
    display_name: str
    extracted_value: Optional[Any] = None
    data_type: str
    confidence: Optional[float] = None
    status: FieldStatus
    original_value: Optional[Any] = None
    corrected_value: Optional[Any] = None
    bounding_box: Optional[dict] = None
    page_number: Optional[int] = None
    extraction_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FieldUpdate(BaseModel):
    """Field update schema."""
    extracted_value: Optional[Any] = None
    corrected_value: Optional[Any] = None


class ValidationRuleResult(BaseModel):
    """Validation rule result schema."""
    id: UUID
    rule_id: UUID
    status: str  # 'passed', 'warning', 'error'
    message: Optional[str] = None
    affected_fields: list[str]
    overridden: bool
    override_reason: Optional[str] = None
    executed_at: datetime
    
    class Config:
        from_attributes = True


class ValidationStateResponse(BaseModel):
    """Validation state response schema."""
    dossier_id: UUID
    fields: list[ExtractedFieldResponse]
    rules: list[ValidationRuleResult]
    confidence_score: Optional[float] = None
    status: str
