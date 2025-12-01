"""CEE Process model."""
from sqlalchemy import Column, String, DateTime, Boolean, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class Process(Base):
    """CEE Process model."""
    __tablename__ = "processes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String, nullable=True)
    version = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_coup_de_pouce = Column(Boolean, default=False, nullable=False)
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=True)
    required_documents = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    dossiers = relationship("Dossier", back_populates="process")
    rules = relationship("ValidationRule", back_populates="process")

