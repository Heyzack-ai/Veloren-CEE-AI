"""Dossier management endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.dossier import Dossier, DossierStatus
from app.models.installer import Installer
from app.models.process import Process
from app.schemas.dossier import DossierCreate, DossierUpdate, DossierResponse, DossierListResponse
from app.services.activity import ActivityLogger

router = APIRouter(prefix="/api/dossiers", tags=["dossiers"])


@router.post("", response_model=DossierResponse, status_code=status.HTTP_201_CREATED)
async def create_dossier(
    dossier_data: DossierCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create new dossier."""
    # Verify process exists
    process_result = await db.execute(
        select(Process).where(Process.id == dossier_data.process_id)
    )
    process = process_result.scalar_one_or_none()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    
    # Verify installer exists
    installer_result = await db.execute(
        select(Installer).where(Installer.id == dossier_data.installer_id)
    )
    installer = installer_result.scalar_one_or_none()
    if not installer:
        raise HTTPException(status_code=404, detail="Installer not found")
    
    # Generate reference
    count_result = await db.execute(select(func.count(Dossier.id)))
    count = count_result.scalar() or 0
    reference = f"DOS-{datetime.now().year}-{count + 1:06d}"
    
    # Create dossier
    dossier = Dossier(
        reference=reference,
        process_id=dossier_data.process_id,
        installer_id=dossier_data.installer_id,
        status=DossierStatus.DRAFT,
        priority=dossier_data.priority,
        beneficiary_name=dossier_data.beneficiary.name,
        beneficiary_address=dossier_data.beneficiary.address,
        beneficiary_city=dossier_data.beneficiary.city,
        beneficiary_postal_code=dossier_data.beneficiary.postal_code,
        beneficiary_email=dossier_data.beneficiary.email,
        beneficiary_phone=dossier_data.beneficiary.phone,
        precarity_status=dossier_data.beneficiary.precarity_status
    )
    
    db.add(dossier)
    await db.commit()
    await db.refresh(dossier)
    
    # Log activity
    logger = ActivityLogger(db)
    await logger.log(
        user_id=str(current_user.id),
        action_type="dossier.created",
        entity_type="dossier",
        entity_id=str(dossier.id),
        entity_reference=dossier.reference,
        description=f"Dossier {dossier.reference} created"
    )
    
    return dossier


@router.get("", response_model=DossierListResponse)
async def list_dossiers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[DossierStatus] = Query(None),
    installer_id: Optional[UUID] = Query(None),
    process_id: Optional[UUID] = Query(None),
    assigned_validator_id: Optional[UUID] = Query(None),
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List dossiers with filters."""
    query = select(Dossier)
    count_query = select(func.count(Dossier.id))
    
    # Apply filters
    filters = []
    if status:
        filters.append(Dossier.status == status)
    if installer_id:
        filters.append(Dossier.installer_id == installer_id)
    if process_id:
        filters.append(Dossier.process_id == process_id)
    if assigned_validator_id:
        filters.append(Dossier.assigned_validator_id == assigned_validator_id)
    
    # Role-based filtering
    if current_user.role == UserRole.INSTALLER:
        # Installers can only see their own dossiers
        installer_result = await db.execute(
            select(Installer).where(Installer.user_id == current_user.id)
        )
        installer = installer_result.scalar_one_or_none()
        if installer:
            filters.append(Dossier.installer_id == installer.id)
        else:
            return DossierListResponse(dossiers=[], total=0, page=page, limit=limit)
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    query = query.order_by(Dossier.created_at.desc())
    query = query.limit(limit).offset((page - 1) * limit)
    
    result = await db.execute(query)
    dossiers = result.scalars().all()
    
    return DossierListResponse(
        dossiers=[DossierResponse.model_validate(d) for d in dossiers],
        total=total,
        page=page,
        limit=limit
    )


@router.get("/{dossier_id}")
async def get_dossier(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get dossier details."""
    result = await db.execute(
        select(Dossier).where(Dossier.id == dossier_id)
    )
    dossier = result.scalar_one_or_none()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
    
    return dossier


@router.patch("/{dossier_id}", response_model=DossierResponse)
async def update_dossier(
    dossier_id: UUID,
    dossier_data: DossierUpdate,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR, UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update dossier."""
    result = await db.execute(
        select(Dossier).where(Dossier.id == dossier_id)
    )
    dossier = result.scalar_one_or_none()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
    
    update_data = dossier_data.model_dump(exclude_unset=True)
    
    # Handle beneficiary update
    if "beneficiary" in update_data:
        beneficiary = update_data.pop("beneficiary")
        if beneficiary:
            dossier.beneficiary_name = beneficiary.get("name", dossier.beneficiary_name)
            dossier.beneficiary_address = beneficiary.get("address", dossier.beneficiary_address)
            dossier.beneficiary_city = beneficiary.get("city", dossier.beneficiary_city)
            dossier.beneficiary_postal_code = beneficiary.get("postal_code", dossier.beneficiary_postal_code)
            dossier.beneficiary_email = beneficiary.get("email", dossier.beneficiary_email)
            dossier.beneficiary_phone = beneficiary.get("phone", dossier.beneficiary_phone)
            dossier.precarity_status = beneficiary.get("precarity_status", dossier.precarity_status)
    
    # Update other fields
    for field, value in update_data.items():
        if hasattr(dossier, field):
            setattr(dossier, field, value)
    
    await db.commit()
    await db.refresh(dossier)
    
    # Log activity
    logger = ActivityLogger(db)
    await logger.log(
        user_id=str(current_user.id),
        action_type="dossier.updated",
        entity_type="dossier",
        entity_id=str(dossier.id),
        entity_reference=dossier.reference,
        description=f"Dossier {dossier.reference} updated"
    )
    
    return dossier


@router.delete("/{dossier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dossier(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete dossier."""
    result = await db.execute(
        select(Dossier).where(Dossier.id == dossier_id)
    )
    dossier = result.scalar_one_or_none()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
    
    reference = dossier.reference
    await db.delete(dossier)
    await db.commit()
    
    # Log activity
    logger = ActivityLogger(db)
    await logger.log(
        user_id=str(current_user.id),
        action_type="dossier.deleted",
        entity_type="dossier",
        entity_id=str(dossier_id),
        entity_reference=reference,
        description=f"Dossier {reference} deleted"
    )


@router.post("/{dossier_id}/assign", response_model=DossierResponse)
async def assign_validator(
    dossier_id: UUID,
    validator_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Assign validator to dossier."""
    # Get dossier
    dossier_result = await db.execute(
        select(Dossier).where(Dossier.id == dossier_id)
    )
    dossier = dossier_result.scalar_one_or_none()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
    
    # Verify validator exists and is a validator
    validator_result = await db.execute(
        select(User).where(User.id == validator_id).where(User.role == UserRole.VALIDATOR)
    )
    validator = validator_result.scalar_one_or_none()
    
    if not validator:
        raise HTTPException(status_code=404, detail="Validator not found")
    
    dossier.assigned_validator_id = validator_id
    if dossier.status == DossierStatus.SUBMITTED:
        dossier.status = DossierStatus.AWAITING_REVIEW
    
    await db.commit()
    await db.refresh(dossier)
    
    # Log activity
    logger = ActivityLogger(db)
    await logger.log(
        user_id=str(current_user.id),
        action_type="dossier.assigned",
        entity_type="dossier",
        entity_id=str(dossier.id),
        entity_reference=dossier.reference,
        description=f"Dossier {dossier.reference} assigned to validator"
    )
    
    return dossier

