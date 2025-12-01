"""Activity logging endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.services.activity import ActivityLogger

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("")
async def list_activities(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Optional[UUID] = Query(None),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[UUID] = Query(None),
    action_types: Optional[list[str]] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """List activity logs."""
    logger = ActivityLogger(db)
    result = await logger.get_activities(
        user_id=str(user_id) if user_id else None,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        action_types=action_types,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=(page - 1) * limit
    )
    
    return {
        "activities": result["activities"],
        "total": result["total"],
        "page": page,
        "limit": limit
    }


@router.get("/{activity_id}")
async def get_activity(
    activity_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get activity details."""
    from sqlalchemy import select
    from app.models.activity_log import ActivityLog
    
    result = await db.execute(
        select(ActivityLog).where(ActivityLog.id == activity_id)
    )
    activity = result.scalar_one_or_none()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return activity

