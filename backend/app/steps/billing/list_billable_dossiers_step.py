"""List billable dossiers endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier, DossierStatus
from app.models.invoice import Invoice
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

config = {
    "name": "ListBillableDossiers",
    "type": "api",
    "path": "/api/billing/dossiers",
    "method": "GET"
}

async def handler(req, context):
    """Handle list billable dossiers request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    query_params = req.get("query", {})
    
    page = int(query_params.get("page", 1))
    page_size = min(int(query_params.get("page_size", 20)), 100)
    status_filter = query_params.get("status")
    installer_id = query_params.get("installer_id")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            # Build query for approved dossiers (billable)
            query = select(Dossier).where(
                Dossier.status == DossierStatus.APPROVED
            )
            
            if status_filter:
                try:
                    status_enum = DossierStatus(status_filter)
                    query = query.where(Dossier.status == status_enum)
                except ValueError:
                    pass
            
            if installer_id:
                try:
                    installer_uuid = UUID(installer_id)
                    query = query.where(Dossier.installer_id == installer_uuid)
                except ValueError:
                    pass
            
            # Get total count
            count_query = select(func.count()).select_from(query.subquery())
            total_result = await db.execute(count_query)
            total = total_result.scalar() or 0
            
            # Apply pagination
            offset = (page - 1) * page_size
            query = query.offset(offset).limit(page_size)
            
            result = await db.execute(query)
            dossiers = result.scalars().all()
            
            # Get invoice status for each dossier
            dossier_list = []
            for dossier in dossiers:
                # Check if invoice exists
                invoice_result = await db.execute(
                    select(Invoice).where(Invoice.dossier_id == dossier.id)
                )
                invoice = invoice_result.scalar_one_or_none()
                
                dossier_list.append({
                    "id": str(dossier.id),
                    "reference": dossier.reference,
                    "installer_id": str(dossier.installer_id),
                    "status": dossier.status.value if hasattr(dossier.status, "value") else str(dossier.status),
                    "approved_at": dossier.approved_at.isoformat() if dossier.approved_at else None,
                    "has_invoice": invoice is not None,
                    "invoice_id": str(invoice.id) if invoice else None,
                    "invoice_status": invoice.status if invoice else None
                })
            
            return {
                "status": 200,
                "body": {
                    "items": dossier_list,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total + page_size - 1) // page_size
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing billable dossiers: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

