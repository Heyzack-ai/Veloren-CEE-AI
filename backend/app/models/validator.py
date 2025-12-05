"""Validator model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class Validator(Base):
    """Validator model."""
    __tablename__ = "validators"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=True, index=True)
    department = Column(String(100), nullable=True)
    specialization = Column(String(255), nullable=True)
    certifications = Column(JSON, default=list, nullable=False)
    max_concurrent_dossiers = Column(String(10), default="10", nullable=False)
    validation_stats = Column(JSON, default=dict, nullable=False)  # approved_count, rejected_count, etc.
    notes = Column(String, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="validator")

