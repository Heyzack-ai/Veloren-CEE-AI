"""List invoices endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.invoice import Invoice
from sqlalchemy import select, func

config = {
    "name": "ListInvoices",
    "type": "api",
    "path": "/api/billing/invoices",
    "method": "GET"
}

async def handler(req, context):
    """Handle list invoices request."""
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
            
            # Build query
            query = select(Invoice)
            
            if status_filter:
                query = query.where(Invoice.status == status_filter)
            
            if installer_id:
                try:
                    installer_uuid = UUID(installer_id)
                    query = query.where(Invoice.installer_id == installer_uuid)
                except ValueError:
                    pass
            
            # Get total count
            count_query = select(func.count()).select_from(query.subquery())
            total_result = await db.execute(count_query)
            total = total_result.scalar() or 0
            
            # Apply pagination
            offset = (page - 1) * page_size
            query = query.order_by(Invoice.created_at.desc()).offset(offset).limit(page_size)
            
            result = await db.execute(query)
            invoices = result.scalars().all()
            
            invoice_list = []
            for invoice in invoices:
                invoice_list.append({
                    "id": str(invoice.id),
                    "invoice_number": invoice.invoice_number,
                    "dossier_id": str(invoice.dossier_id),
                    "installer_id": str(invoice.installer_id),
                    "status": invoice.status,
                    "total_amount": float(invoice.total_amount),
                    "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                    "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None,
                    "created_at": invoice.created_at.isoformat() if invoice.created_at else None
                })
            
            return {
                "status": 200,
                "body": {
                    "items": invoice_list,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total + page_size - 1) // page_size
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error listing invoices: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

