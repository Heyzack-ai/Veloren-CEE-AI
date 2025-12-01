"""Invoice model."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class Invoice(Base):
    """Invoice model."""
    __tablename__ = "invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    dossier_id = Column(UUID(as_uuid=True), ForeignKey("dossiers.id"), nullable=False)
    installer_id = Column(UUID(as_uuid=True), ForeignKey("installers.id"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False)
    kwh_cumac = Column(Numeric(12, 2), nullable=True)
    price_per_kwh = Column(Numeric(8, 6), nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    payment_on_validation = Column(Numeric(12, 2), nullable=True)
    payment_on_emmy = Column(Numeric(12, 2), nullable=True)
    due_date = Column(Date, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    payment_reference = Column(String(100), nullable=True)
    payment_method = Column(String(50), nullable=True)
    pdf_path = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    dossier = relationship("Dossier", back_populates="invoices")
    installer = relationship("Installer", backref="invoices")

