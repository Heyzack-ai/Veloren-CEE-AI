"""Billing endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.invoice import Invoice
from app.models.dossier import Dossier
from app.schemas.billing import InvoiceResponse, BillingSummary, PaymentRecord

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/summary", response_model=BillingSummary)
async def get_billing_summary(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get billing summary."""
    query = select(Invoice)
    
    if date_from:
        query = query.where(Invoice.created_at >= date_from)
    if date_to:
        query = query.where(Invoice.created_at <= date_to)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    total_amount = sum(inv.total_amount for inv in invoices)
    paid_amount = sum(inv.total_amount for inv in invoices if inv.paid_at)
    pending_amount = total_amount - paid_amount
    
    return BillingSummary(
        total_invoices=len(invoices),
        total_amount=total_amount,
        paid_amount=paid_amount,
        pending_amount=pending_amount,
        invoices=[InvoiceResponse.model_validate(inv) for inv in invoices]
    )


@router.get("/dossiers", response_model=list[dict])
async def list_billable_dossiers(
    status: Optional[str] = Query(None),
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List billable dossiers."""
    query = select(Dossier).where(Dossier.status == "approved")
    
    if status:
        query = query.where(Dossier.status == status)
    
    result = await db.execute(query)
    dossiers = result.scalars().all()
    
    # Check which dossiers already have invoices
    dossier_ids = [d.id for d in dossiers]
    invoice_result = await db.execute(
        select(Invoice.dossier_id).where(Invoice.dossier_id.in_(dossier_ids))
    )
    invoiced_ids = {row[0] for row in invoice_result.all()}
    
    return [
        {
            "dossier_id": str(d.id),
            "reference": d.reference,
            "has_invoice": d.id in invoiced_ids
        }
        for d in dossiers
    ]


@router.post("/dossiers/{dossier_id}/invoice", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def generate_invoice(
    dossier_id: UUID,
    kwh_cumac: Optional[Decimal] = None,
    price_per_kwh: Optional[Decimal] = None,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Generate invoice for dossier."""
    # Get dossier
    dossier_result = await db.execute(
        select(Dossier).where(Dossier.id == dossier_id)
    )
    dossier = dossier_result.scalar_one_or_none()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
    
    # Check if invoice already exists
    invoice_result = await db.execute(
        select(Invoice).where(Invoice.dossier_id == dossier_id)
    )
    if invoice_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice already exists for this dossier"
        )
    
    # Generate invoice number
    count_result = await db.execute(select(func.count(Invoice.id)))
    count = count_result.scalar() or 0
    invoice_number = f"INV-{date.today().year}-{count + 1:06d}"
    
    # Calculate total amount
    total_amount = Decimal("0.00")
    if kwh_cumac and price_per_kwh:
        total_amount = kwh_cumac * price_per_kwh
    
    invoice = Invoice(
        dossier_id=dossier_id,
        installer_id=dossier.installer_id,
        invoice_number=invoice_number,
        kwh_cumac=kwh_cumac,
        price_per_kwh=price_per_kwh,
        total_amount=total_amount,
        status="pending"
    )
    
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    
    return invoice


@router.post("/dossiers/{dossier_id}/payment")
async def record_payment(
    dossier_id: UUID,
    payment: PaymentRecord,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Record payment for invoice."""
    invoice_result = await db.execute(
        select(Invoice).where(Invoice.id == payment.invoice_id).where(Invoice.dossier_id == dossier_id)
    )
    invoice = invoice_result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice.paid_at = payment.paid_at
    invoice.payment_reference = payment.payment_reference
    invoice.payment_method = payment.payment_method
    invoice.status = "paid"
    
    await db.commit()
    
    return {"message": "Payment recorded"}


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    status: Optional[str] = Query(None),
    installer_id: Optional[UUID] = Query(None),
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List invoices."""
    query = select(Invoice)
    
    if status:
        query = query.where(Invoice.status == status)
    if installer_id:
        query = query.where(Invoice.installer_id == installer_id)
    
    query = query.order_by(Invoice.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get invoice details."""
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

