"""Audit logging service."""
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_log import ActivityLog
import uuid


class AuditService:
    """Service for logging system activities."""
    
    async def log_action(
        self,
        db: AsyncSession,
        user_id: Optional[uuid.UUID],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> None:
        """
        Log an audit action.
        
        Args:
            db: Database session
            user_id: User ID performing action (UUID)
            action: Action name
            resource_type: Type of resource (e.g., "user", "dossier")
            resource_id: ID of resource (UUID)
            details: Additional details as dictionary
            ip_address: IP address of requester
        """
        activity_log = ActivityLog(
            user_id=user_id,
            action_type=action,
            entity_type=resource_type or "system",
            entity_id=resource_id,
            meta_data=details or {},
            ip_address=ip_address
        )
        db.add(activity_log)
        await db.commit()


audit_service = AuditService()

