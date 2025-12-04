"""Get billing summary endpoint step."""
from datetime import date
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.invoice import Invoice
from sqlalchemy import select

config = {
    "name": "GetBillingSummary",
    "type": "api",
    "path": "/api/billing/summary",
    "method": "GET",
    "responseSchema": {
        "total_invoices": {"type": "integer"},
        "total_amount": {"type": "number"},
        "paid_amount": {"type": "number"},
        "pending_amount": {"type": "number"},
        "invoices": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "format": "uuid"},
                    "invoice_number": {"type": "string"},
                    "total_amount": {"type": "number"},
                    "status": {"type": "string"},
                    "created_at": {"type": "string", "format": "date-time"}
                }
            }
        }
    }
}

async def handler(req, context):
    """Handle get billing summary request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    query = req.get("query", {})
    date_from_str = query.get("date_from")
    date_to_str = query.get("date_to")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            query_obj = select(Invoice)
            
            if date_from_str:
                try:
                    date_from = date.fromisoformat(date_from_str)
                    query_obj = query_obj.where(Invoice.created_at >= date_from)
                except ValueError:
                    pass
            if date_to_str:
                try:
                    date_to = date.fromisoformat(date_to_str)
                    query_obj = query_obj.where(Invoice.created_at <= date_to)
                except ValueError:
                    pass
            
            result = await db.execute(query_obj)
            invoices = result.scalars().all()
            
            total_amount = sum(inv.total_amount for inv in invoices)
            paid_amount = sum(inv.total_amount for inv in invoices if inv.paid_at)
            pending_amount = total_amount - paid_amount
            
            return {
                "status": 200,
                "body": {
                    "total_invoices": len(invoices),
                    "total_amount": float(total_amount),
                    "paid_amount": float(paid_amount),
                    "pending_amount": float(pending_amount),
                    "invoices": [
                        {
                            "id": str(inv.id),
                            "invoice_number": inv.invoice_number,
                            "total_amount": float(inv.total_amount),
                            "status": inv.status,
                            "created_at": inv.created_at.isoformat() if inv.created_at else None
                        }
                        for inv in invoices
                    ]
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting billing summary: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

