"""Validation Rule model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class ValidationRule(Base):
    """Validation Rule model."""
    __tablename__ = "validation_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey("processes.id"), nullable=True)
    document_type_id = Column(UUID(as_uuid=True), ForeignKey("document_types.id"), nullable=True)
    rule_type = Column(String(50), nullable=False)  # 'document', 'cross_document', 'business'
    severity = Column(String(20), default="error", nullable=False)  # 'error', 'warning', 'info'
    expression = Column(Text, nullable=False)
    error_message = Column(Text, nullable=False)
    can_override = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    process = relationship("Process", back_populates="rules")
    document_type = relationship("DocumentType", back_populates="rules")
    validation_results = relationship("ValidationResult", back_populates="rule")

