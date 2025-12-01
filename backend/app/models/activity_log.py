"""Activity Log model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Index
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class ActivityLog(Base):
    """Activity Log model."""
    __tablename__ = "activity_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    action_type = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    entity_reference = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    meta_data = Column("metadata", JSON, default=dict, nullable=False)  # Column name in DB is "metadata"
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Indexes for common queries
    __table_args__ = (
        Index("idx_activity_logs_entity", "entity_type", "entity_id"),
    )

