"""Installer model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class Installer(Base):
    """Installer model."""
    __tablename__ = "installers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    company_name = Column(String(255), nullable=False)
    siret = Column(String(14), unique=True, nullable=False, index=True)
    siren = Column(String(9), nullable=False)
    address = Column(String, nullable=False)
    city = Column(String(255), nullable=False)
    postal_code = Column(String(10), nullable=False)
    contact_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    rge_number = Column(String(50), nullable=True)
    rge_valid_until = Column(Date, nullable=True)
    rge_status = Column(String(20), default="not_verified", nullable=False)
    qualifications = Column(JSON, default=list, nullable=False)
    contract_reference = Column(String(100), nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="installer")
    dossiers = relationship("Dossier", back_populates="installer")

