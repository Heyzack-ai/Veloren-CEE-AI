"""Human Feedback model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class HumanFeedback(Base):
    """Human Feedback model for training improvement."""
    __tablename__ = "human_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    dossier_id = Column(UUID(as_uuid=True), ForeignKey("dossiers.id"), nullable=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    extracted_field_id = Column(UUID(as_uuid=True), ForeignKey("extracted_fields.id"), nullable=True)
    feedback_type = Column(String(50), nullable=False)  # 'field_correction', 'classification_error', 'extraction_error'
    original_value = Column(JSON, nullable=True)
    corrected_value = Column(JSON, nullable=True)
    field_name = Column(String(100), nullable=True)
    document_type = Column(String(100), nullable=True)
    context_data = Column(JSON, nullable=True)  # surrounding text, image region, etc.
    model_used = Column(String(100), nullable=True)
    model_version = Column(String(50), nullable=True)
    confidence_before = Column(Numeric(5, 4), nullable=True)
    validator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    used_for_training = Column(Boolean, default=False, nullable=False, index=True)
    training_batch_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    dossier = relationship("Dossier", back_populates="feedback")
    document = relationship("Document", back_populates="feedback")
    extracted_field = relationship("ExtractedField", back_populates="feedback")
    validator = relationship("User", foreign_keys=[validator_id])

