"""Model Performance Metrics model."""
from sqlalchemy import Column, String, DateTime, Numeric, Integer, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class ModelPerformanceMetrics(Base):
    """Model Performance Metrics model."""
    __tablename__ = "model_performance_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=True)
    task_type = Column(String(50), nullable=False)  # 'classification', 'extraction', 'ocr'
    metric_name = Column(String(50), nullable=False)  # 'accuracy', 'precision', 'recall', 'f1'
    metric_value = Column(Numeric(8, 6), nullable=False)
    sample_size = Column(Integer, nullable=True)
    evaluation_date = Column(Date, nullable=False)
    metadata = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

