"""Get invoice endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.invoice import Invoice
from sqlalchemy import select

config = {
    "name": "GetInvoice",
    "type": "api",
    "path": "/api/billing/invoices/{invoice_id}",
    "method": "GET"
}

async def handler(req, context):
    """Handle get invoice request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    path_params = req.get("pathParams", {})
    
    invoice_id_str = path_params.get("invoice_id")
    if not invoice_id_str:
        return {"status": 400, "body": {"detail": "invoice_id is required"}}
    
    try:
        invoice_id = UUID(invoice_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid invoice_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR, UserRole.VALIDATOR])
            
            # Get invoice
            invoice_result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
            invoice = invoice_result.scalar_one_or_none()
            if not invoice:
                return {"status": 404, "body": {"detail": "Invoice not found"}}
            
            return {
                "status": 200,
                "body": {
                    "id": str(invoice.id),
                    "invoice_number": invoice.invoice_number,
                    "dossier_id": str(invoice.dossier_id),
                    "installer_id": str(invoice.installer_id),
                    "status": invoice.status,
                    "kwh_cumac": float(invoice.kwh_cumac) if invoice.kwh_cumac else None,
                    "price_per_kwh": float(invoice.price_per_kwh) if invoice.price_per_kwh else None,
                    "total_amount": float(invoice.total_amount),
                    "payment_on_validation": float(invoice.payment_on_validation) if invoice.payment_on_validation else None,
                    "payment_on_emmy": float(invoice.payment_on_emmy) if invoice.payment_on_emmy else None,
                    "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                    "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None,
                    "payment_reference": invoice.payment_reference,
                    "payment_method": invoice.payment_method,
                    "pdf_path": invoice.pdf_path,
                    "created_at": invoice.created_at.isoformat() if invoice.created_at else None,
                    "updated_at": invoice.updated_at.isoformat() if invoice.updated_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting invoice: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

