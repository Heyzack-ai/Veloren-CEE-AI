"""Report schemas."""
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime


class SystemReportResponse(BaseModel):
    """System report response schema."""
    total_users: int
    total_document_types: int
    total_submissions: int
    submissions_by_status: Dict[str, int]
    submissions_by_document_type: Dict[str, int]
    recent_activity: List[Dict[str, Any]]

