"""Generate invoice endpoint step."""
from uuid import UUID
from datetime import datetime, date
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier, DossierStatus
from app.models.invoice import Invoice
from app.models.installer import Installer
from sqlalchemy import select, func

config = {
    "name": "GenerateInvoice",
    "type": "api",
    "path": "/api/billing/dossiers/{dossier_id}/invoice",
    "method": "POST",
    "bodySchema": {
        "kwh_cumac": {"type": "number"},
        "price_per_kwh": {"type": "number"},
        "payment_on_validation": {"type": "number"},
        "payment_on_emmy": {"type": "number"},
        "due_date": {"type": "string", "format": "date"}
    },
    "responseSchema": {
        "id": {"type": "string", "format": "uuid"},
        "invoice_number": {"type": "string"},
        "dossier_id": {"type": "string", "format": "uuid"},
        "installer_id": {"type": "string", "format": "uuid"},
        "status": {"type": "string"},
        "kwh_cumac": {"type": "number"},
        "price_per_kwh": {"type": "number"},
        "total_amount": {"type": "number"},
        "payment_on_validation": {"type": "number"},
        "payment_on_emmy": {"type": "number"},
        "due_date": {"type": "string", "format": "date"},
        "created_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle generate invoice request."""
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
    
    try:
        dossier_id = UUID(dossier_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid dossier_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Get dossier
            dossier_result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = dossier_result.scalar_one_or_none()
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            if dossier.status != DossierStatus.APPROVED:
                return {
                    "status": 400,
                    "body": {"detail": "Invoice can only be generated for approved dossiers"}
                }
            
            # Check if invoice already exists
            existing_invoice = await db.execute(
                select(Invoice).where(Invoice.dossier_id == dossier_id)
            )
            if existing_invoice.scalar_one_or_none():
                return {
                    "status": 400,
                    "body": {"detail": "Invoice already exists for this dossier"}
                }
            
            # Get installer
            installer_result = await db.execute(
                select(Installer).where(Installer.id == dossier.installer_id)
            )
            installer = installer_result.scalar_one_or_none()
            if not installer:
                return {"status": 404, "body": {"detail": "Installer not found"}}
            
            # Calculate total amount
            kwh_cumac = body.get("kwh_cumac", 0)
            price_per_kwh = body.get("price_per_kwh", 0)
            payment_on_validation = body.get("payment_on_validation", 0)
            payment_on_emmy = body.get("payment_on_emmy", 0)
            
            total_amount = (kwh_cumac * price_per_kwh) + payment_on_validation + payment_on_emmy
            
            # Generate invoice number
            count_result = await db.execute(select(func.count(Invoice.id)))
            count = count_result.scalar() or 0
            invoice_number = f"INV-{datetime.now().year}-{count + 1:06d}"
            
            # Parse due date
            due_date = None
            if body.get("due_date"):
                try:
                    due_date = datetime.fromisoformat(body["due_date"].replace("Z", "+00:00")).date()
                except (ValueError, AttributeError):
                    try:
                        due_date = datetime.strptime(body["due_date"], "%Y-%m-%d").date()
                    except ValueError:
                        pass
            
            # Create invoice
            invoice = Invoice(
                dossier_id=dossier_id,
                installer_id=dossier.installer_id,
                invoice_number=invoice_number,
                status="pending",
                kwh_cumac=kwh_cumac,
                price_per_kwh=price_per_kwh,
                total_amount=total_amount,
                payment_on_validation=payment_on_validation,
                payment_on_emmy=payment_on_emmy,
                due_date=due_date
            )
            
            db.add(invoice)
            await db.commit()
            await db.refresh(invoice)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="invoice.generated",
                    entity_type="invoice",
                    entity_id=str(invoice.id),
                    description=f"Invoice {invoice_number} generated for dossier {dossier.reference}"
                )
            except Exception:
                pass
            
            return {
                "status": 201,
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
                    "created_at": invoice.created_at.isoformat() if invoice.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error generating invoice: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

