"""Record payment endpoint step."""
from uuid import UUID
from datetime import datetime
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.invoice import Invoice
from sqlalchemy import select

config = {
    "name": "RecordPayment",
    "type": "api",
    "path": "/api/billing/dossiers/{dossier_id}/payment",
    "method": "POST",
    "bodySchema": {
        "amount": {"type": "number"},
        "payment_reference": {"type": "string"},
        "payment_method": {"type": "string"}
    }
}

async def handler(req, context):
    """Handle record payment request."""
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
    body = req.get("body", {})
    
    dossier_id_str = path_params.get("dossier_id")
    if not dossier_id_str:
        return {"status": 400, "body": {"detail": "dossier_id is required"}}
    
    amount = body.get("amount")
    payment_reference = body.get("payment_reference")
    payment_method = body.get("payment_method", "bank_transfer")
    
    if amount is None:
        return {"status": 422, "body": {"detail": "amount is required"}}
    
    try:
        dossier_id = UUID(dossier_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid dossier_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get invoice
            invoice_result = await db.execute(
                select(Invoice).where(Invoice.dossier_id == dossier_id)
            )
            invoice = invoice_result.scalar_one_or_none()
            if not invoice:
                return {"status": 404, "body": {"detail": "Invoice not found for this dossier"}}
            
            # Update invoice with payment
            invoice.status = "paid"
            invoice.paid_at = datetime.utcnow()
            invoice.payment_reference = payment_reference
            invoice.payment_method = payment_method
            await db.commit()
            await db.refresh(invoice)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="invoice.paid",
                    entity_type="invoice",
                    entity_id=str(invoice.id),
                    description=f"Payment recorded for invoice {invoice.invoice_number}: {amount}"
                )
            except Exception:
                pass
            
            return {
                "status": 200,
                "body": {
                    "id": str(invoice.id),
                    "invoice_number": invoice.invoice_number,
                    "status": invoice.status,
                    "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None,
                    "payment_reference": invoice.payment_reference,
                    "payment_method": invoice.payment_method,
                    "total_amount": float(invoice.total_amount)
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error recording payment: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

