"""Validation rule schemas."""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any


class RuleCreate(BaseModel):
    """Rule creation schema."""
    name: str
    document_type_id: int
    rule_config: Dict[str, Any]
    description: Optional[str] = None


class RuleUpdate(BaseModel):
    """Rule update schema."""
    name: Optional[str] = None
    rule_config: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RuleResponse(BaseModel):
    """Rule response schema."""
    id: int
    name: str
    document_type_id: int
    rule_config: Dict[str, Any]
    description: Optional[str]
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

