"""Validation schemas."""
from datetime import datetime
from pydantic import BaseModel
from typing import Dict, Any, Optional, List


class RuleResultResponse(BaseModel):
    """Rule result response schema."""
    id: int
    submission_id: int
    rule_id: int
    passed: bool
    result_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    executed_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class ValidationRunRequest(BaseModel):
    """Validation run request schema."""
    submission_id: int
    rule_ids: Optional[List[int]] = None  # If None, run all rules for document type


class ValidationResponse(BaseModel):
    """Validation response schema."""
    submission_id: int
    results: List[RuleResultResponse]
    all_passed: bool

