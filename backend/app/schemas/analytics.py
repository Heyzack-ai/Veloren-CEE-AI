"""Analytics schemas."""
from datetime import datetime
from typing import Optional, dict
from pydantic import BaseModel


class DossierMetrics(BaseModel):
    """Dossier metrics schema."""
    total: int
    by_status: dict[str, int]
    submitted_today: int
    validated_today: int
    avg_processing_time: float


class ValidationMetrics(BaseModel):
    """Validation metrics schema."""
    pending_review: int
    avg_confidence: float
    correction_rate: float
    override_rate: float


class PerformanceMetrics(BaseModel):
    """Performance metrics schema."""
    avg_validation_time: float
    dossiers_per_validator: dict[str, int]
    model_accuracy: dict[str, float]


class DashboardMetrics(BaseModel):
    """Dashboard metrics schema."""
    dossiers: DossierMetrics
    validation: ValidationMetrics
    performance: PerformanceMetrics

