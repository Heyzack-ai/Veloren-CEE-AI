"""Extracted data model."""
from sqlalchemy import Column, Integer, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class ExtractedData(Base):
    """Extracted data model for storing extracted information from PDFs."""
    __tablename__ = "extracted_data"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("submission_files.id"), nullable=True)
    extracted_data = Column(JSON, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
