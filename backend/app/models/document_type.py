"""Document type model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class DocumentType(Base):
    """Document type model."""
    __tablename__ = "document_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    category = Column(String(50), nullable=True)
    extraction_schema_id = Column(UUID(as_uuid=True), ForeignKey("field_schemas.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    documents = relationship("Document", back_populates="document_type")
    field_schemas = relationship("FieldSchema", back_populates="document_type")
    rules = relationship("ValidationRule", back_populates="document_type")
