"""Extracted Field model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Numeric, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum


class FieldStatus(str, enum.Enum):
    """Field status enumeration."""
    UNREVIEWED = "unreviewed"
    CONFIRMED = "confirmed"
    CORRECTED = "corrected"
    MARKED_WRONG = "marked_wrong"


class ExtractedField(Base):
    """Extracted Field model."""
    __tablename__ = "extracted_fields"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    dossier_id = Column(UUID(as_uuid=True), ForeignKey("dossiers.id", ondelete="CASCADE"), nullable=False, index=True)
    field_schema_id = Column(UUID(as_uuid=True), ForeignKey("field_schemas.id"), nullable=True)
    field_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    extracted_value = Column(JSON, nullable=True)
    data_type = Column(String(50), nullable=False)
    confidence = Column(Numeric(5, 4), nullable=True)
    status = Column(Enum(FieldStatus), default=FieldStatus.UNREVIEWED, nullable=False, index=True)
    original_value = Column(JSON, nullable=True)
    corrected_value = Column(JSON, nullable=True)
    bounding_box = Column(JSON, nullable=True)
    page_number = Column(Integer, nullable=True)
    extraction_method = Column(String(50), nullable=True)
    marked_wrong_at = Column(DateTime(timezone=True), nullable=True)
    marked_wrong_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="extracted_fields")
    dossier = relationship("Dossier", back_populates="extracted_fields")
    field_schema = relationship("FieldSchema", back_populates="extracted_fields")
    marked_wrong_by_user = relationship("User", foreign_keys=[marked_wrong_by])
    confirmed_by_user = relationship("User", foreign_keys=[confirmed_by])
    feedback = relationship("HumanFeedback", back_populates="extracted_field")

