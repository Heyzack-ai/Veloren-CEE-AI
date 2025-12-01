"""Feedback endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.feedback import HumanFeedback

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Submit correction feedback."""
    feedback = HumanFeedback(**feedback_data, validator_id=current_user.id)
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    
    return feedback


@router.get("")
async def list_feedback(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    dossier_id: Optional[UUID] = Query(None),
    feedback_type: Optional[str] = Query(None),
    used_for_training: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """List feedback entries."""
    query = select(HumanFeedback)
    
    if dossier_id:
        query = query.where(HumanFeedback.dossier_id == dossier_id)
    if feedback_type:
        query = query.where(HumanFeedback.feedback_type == feedback_type)
    if used_for_training is not None:
        query = query.where(HumanFeedback.used_for_training == used_for_training)
    
    query = query.order_by(HumanFeedback.created_at.desc())
    query = query.limit(limit).offset((page - 1) * limit)
    
    result = await db.execute(query)
    feedbacks = result.scalars().all()
    
    # Get total count
    count_query = select(HumanFeedback)
    if dossier_id:
        count_query = count_query.where(HumanFeedback.dossier_id == dossier_id)
    if feedback_type:
        count_query = count_query.where(HumanFeedback.feedback_type == feedback_type)
    if used_for_training is not None:
        count_query = count_query.where(HumanFeedback.used_for_training == used_for_training)
    
    from sqlalchemy import func
    count_result = await db.execute(select(func.count(HumanFeedback.id)).select_from(count_query.subquery()))
    total = count_result.scalar() or 0
    
    return {
        "feedback": feedbacks,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{feedback_id}")
async def get_feedback(
    feedback_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get feedback details."""
    result = await db.execute(
        select(HumanFeedback).where(HumanFeedback.id == feedback_id)
    )
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return feedback


@router.get("/stats/summary")
async def get_feedback_stats(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get feedback statistics."""
    from sqlalchemy import func
    
    total_result = await db.execute(select(func.count(HumanFeedback.id)))
    total = total_result.scalar() or 0
    
    used_result = await db.execute(
        select(func.count(HumanFeedback.id)).where(HumanFeedback.used_for_training == True)
    )
    used = used_result.scalar() or 0
    
    by_type_result = await db.execute(
        select(HumanFeedback.feedback_type, func.count(HumanFeedback.id))
        .group_by(HumanFeedback.feedback_type)
    )
    by_type = {row[0]: row[1] for row in by_type_result.all()}
    
    return {
        "total": total,
        "used_for_training": used,
        "pending": total - used,
        "by_type": by_type
    }


@router.post("/export")
async def export_training_data(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    feedback_type: Optional[str] = None,
    field_name: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Export training dataset."""
    # TODO: Implement training dataset export
    return {"message": "Training dataset export not yet implemented"}

