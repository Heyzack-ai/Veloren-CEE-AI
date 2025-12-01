"""Billing schemas."""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel


class InvoiceResponse(BaseModel):
    """Invoice response schema."""
    id: UUID
    dossier_id: UUID
    installer_id: UUID
    invoice_number: str
    status: str
    kwh_cumac: Optional[Decimal] = None
    price_per_kwh: Optional[Decimal] = None
    total_amount: Decimal
    payment_on_validation: Optional[Decimal] = None
    payment_on_emmy: Optional[Decimal] = None
    due_date: Optional[date] = None
    paid_at: Optional[datetime] = None
    payment_reference: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BillingSummary(BaseModel):
    """Billing summary schema."""
    total_invoices: int
    total_amount: Decimal
    paid_amount: Decimal
    pending_amount: Decimal
    invoices: list[InvoiceResponse]


class PaymentRecord(BaseModel):
    """Payment record schema."""
    invoice_id: UUID
    amount: Decimal
    payment_reference: str
    payment_method: str
    paid_at: datetime

