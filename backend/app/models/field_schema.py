"""Field Schema model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class FieldSchema(Base):
    """Field Schema model."""
    __tablename__ = "field_schemas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    document_type_id = Column(UUID(as_uuid=True), ForeignKey("document_types.id"), nullable=False)
    field_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data_type = Column(String(50), nullable=False)
    is_required = Column(Boolean, default=False, nullable=False)
    validation_pattern = Column(String(255), nullable=True)
    extraction_hints = Column(JSON, nullable=True)
    default_value = Column(JSON, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Unique constraint
    __table_args__ = (
        {"extend_existing": True},
    )
    
    # Relationships
    document_type = relationship("DocumentType", back_populates="field_schemas")
    extracted_fields = relationship("ExtractedField", back_populates="field_schema")

