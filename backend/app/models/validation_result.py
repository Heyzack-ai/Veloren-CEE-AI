"""Validation Result model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class ValidationResult(Base):
    """Validation Result model."""
    __tablename__ = "validation_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    dossier_id = Column(UUID(as_uuid=True), ForeignKey("dossiers.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("validation_rules.id"), nullable=False)
    status = Column(String(20), nullable=False)  # 'passed', 'warning', 'error'
    message = Column(Text, nullable=True)
    affected_fields = Column(JSON, default=list, nullable=False)
    overridden = Column(Boolean, default=False, nullable=False)
    override_reason = Column(Text, nullable=True)
    overridden_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    overridden_at = Column(DateTime(timezone=True), nullable=True)
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    dossier = relationship("Dossier", back_populates="validation_results")
    rule = relationship("ValidationRule", back_populates="validation_results")
    overridden_by_user = relationship("User", foreign_keys=[overridden_by])

