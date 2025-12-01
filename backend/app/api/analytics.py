"""Analytics endpoints."""
from typing import Annotated, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.dossier import Dossier
from app.models.extracted_field import ExtractedField
from app.models.validation_result import ValidationResult
from app.schemas.analytics import DashboardMetrics, DossierMetrics, ValidationMetrics, PerformanceMetrics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR, UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get dashboard metrics."""
    # Dossier metrics
    dossier_query = select(Dossier)
    if date_from:
        dossier_query = dossier_query.where(Dossier.created_at >= date_from)
    if date_to:
        dossier_query = dossier_query.where(Dossier.created_at <= date_to)
    
    dossier_result = await db.execute(dossier_query)
    all_dossiers = dossier_result.scalars().all()
    
    by_status = {}
    for dossier in all_dossiers:
        by_status[dossier.status.value] = by_status.get(dossier.status.value, 0) + 1
    
    today = date.today()
    submitted_today = sum(1 for d in all_dossiers if d.submitted_at and d.submitted_at.date() == today)
    validated_today = sum(1 for d in all_dossiers if d.validated_at and d.validated_at.date() == today)
    
    processing_times = [d.processing_time_ms for d in all_dossiers if d.processing_time_ms]
    avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0.0
    
    dossier_metrics = DossierMetrics(
        total=len(all_dossiers),
        by_status=by_status,
        submitted_today=submitted_today,
        validated_today=validated_today,
        avg_processing_time=avg_processing_time
    )
    
    # Validation metrics
    field_query = select(ExtractedField)
    field_result = await db.execute(field_query)
    all_fields = field_result.scalars().all()
    
    pending_review = sum(1 for f in all_fields if f.status.value == "unreviewed")
    confidences = [f.confidence for f in all_fields if f.confidence]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    
    corrected = sum(1 for f in all_fields if f.status.value == "corrected")
    correction_rate = corrected / len(all_fields) if all_fields else 0.0
    
    rule_result_query = select(ValidationResult)
    rule_result = await db.execute(rule_result_query)
    all_results = rule_result.scalars().all()
    
    overridden = sum(1 for r in all_results if r.overridden)
    override_rate = overridden / len(all_results) if all_results else 0.0
    
    validation_metrics = ValidationMetrics(
        pending_review=pending_review,
        avg_confidence=float(avg_confidence),
        correction_rate=correction_rate,
        override_rate=override_rate
    )
    
    # Performance metrics
    validation_times = [d.processing_time_ms for d in all_dossiers if d.processing_time_ms and d.validated_at]
    avg_validation_time = sum(validation_times) / len(validation_times) if validation_times else 0.0
    
    # Dossiers per validator
    validator_counts = {}
    for dossier in all_dossiers:
        if dossier.assigned_validator_id:
            validator_id = str(dossier.assigned_validator_id)
            validator_counts[validator_id] = validator_counts.get(validator_id, 0) + 1
    
    performance_metrics = PerformanceMetrics(
        avg_validation_time=avg_validation_time,
        dossiers_per_validator=validator_counts,
        model_accuracy={}  # TODO: Calculate from model performance metrics
    )
    
    return DashboardMetrics(
        dossiers=dossier_metrics,
        validation=validation_metrics,
        performance=performance_metrics
    )

