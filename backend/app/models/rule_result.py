"""Rule result model."""
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class RuleResult(Base):
    """Rule result model for storing validation rule execution results."""
    __tablename__ = "rule_results"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=False)
    passed = Column(Boolean, nullable=False)
    result_data = Column(JSON, nullable=True)
    error_message = Column(String, nullable=True)
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
