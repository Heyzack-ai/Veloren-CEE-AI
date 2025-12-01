"""Dossier model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum


class DossierStatus(str, enum.Enum):
    """Dossier status enumeration."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    AWAITING_REVIEW = "awaiting_review"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class Priority(str, enum.Enum):
    """Priority enumeration."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Dossier(Base):
    """Dossier model."""
    __tablename__ = "dossiers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    reference = Column(String(50), unique=True, nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey("processes.id"), nullable=False)
    installer_id = Column(UUID(as_uuid=True), ForeignKey("installers.id"), nullable=False)
    assigned_validator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(Enum(DossierStatus), default=DossierStatus.DRAFT, nullable=False, index=True)
    priority = Column(Enum(Priority), default=Priority.NORMAL, nullable=False)
    beneficiary_name = Column(String(255), nullable=False)
    beneficiary_address = Column(String, nullable=False)
    beneficiary_city = Column(String(255), nullable=False)
    beneficiary_postal_code = Column(String(10), nullable=False)
    beneficiary_email = Column(String(255), nullable=True)
    beneficiary_phone = Column(String(20), nullable=True)
    precarity_status = Column(String(50), nullable=True)
    confidence_score = Column(Numeric(5, 4), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    process = relationship("Process", back_populates="dossiers")
    installer = relationship("Installer", back_populates="dossiers")
    assigned_validator = relationship("User", foreign_keys=[assigned_validator_id], backref="assigned_dossiers")
    validated_by_user = relationship("User", foreign_keys=[validated_by], backref="validated_dossiers")
    documents = relationship("Document", back_populates="dossier", cascade="all, delete-orphan")
    extracted_fields = relationship("ExtractedField", back_populates="dossier", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="dossier", cascade="all, delete-orphan")
    feedback = relationship("HumanFeedback", back_populates="dossier")
    invoices = relationship("Invoice", back_populates="dossier")

