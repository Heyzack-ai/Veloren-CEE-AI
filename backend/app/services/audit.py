"""Audit logging service."""
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog


class AuditService:
    """Service for logging system activities."""
    
    async def log_action(
        self,
        db: AsyncSession,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> None:
        """
        Log an audit action.
        
        Args:
            db: Database session
            user_id: User ID performing action
            action: Action name
            resource_type: Type of resource (e.g., "user", "submission")
            resource_id: ID of resource
            details: Additional details as dictionary
            ip_address: IP address of requester
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        db.add(audit_log)
        await db.commit()


audit_service = AuditService()

