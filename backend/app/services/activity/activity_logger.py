"""Activity Logger Service."""
from datetime import datetime
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog


class ActivityLogger:
    """Service for logging and querying activity logs."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user_id: Optional[str],
        action_type: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        entity_reference: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        duration_ms: Optional[int] = None
    ) -> ActivityLog:
        """Log an activity entry."""
        activity = ActivityLog(
            user_id=user_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_reference=entity_reference,
            description=description,
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
            duration_ms=duration_ms
        )

        self.db.add(activity)
        await self.db.commit()
        await self.db.refresh(activity)

        return activity

    async def get_activities(
        self,
        user_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        action_types: Optional[list[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0
    ) -> dict:
        """Query activity logs with filters."""
        query = select(ActivityLog)
        count_query = select(func.count(ActivityLog.id))

        if user_id:
            query = query.where(ActivityLog.user_id == user_id)
            count_query = count_query.where(ActivityLog.user_id == user_id)
        if entity_type:
            query = query.where(ActivityLog.entity_type == entity_type)
            count_query = count_query.where(ActivityLog.entity_type == entity_type)
        if entity_id:
            query = query.where(ActivityLog.entity_id == entity_id)
            count_query = count_query.where(ActivityLog.entity_id == entity_id)
        if action_types:
            query = query.where(ActivityLog.action_type.in_(action_types))
            count_query = count_query.where(ActivityLog.action_type.in_(action_types))
        if date_from:
            query = query.where(ActivityLog.created_at >= date_from)
            count_query = count_query.where(ActivityLog.created_at >= date_from)
        if date_to:
            query = query.where(ActivityLog.created_at <= date_to)
            count_query = count_query.where(ActivityLog.created_at <= date_to)

        query = query.order_by(ActivityLog.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await self.db.execute(query)
        activities = result.scalars().all()

        count_result = await self.db.execute(count_query)
        total = count_result.scalar()

        return {"activities": activities, "total": total}

