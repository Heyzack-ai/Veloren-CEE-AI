"""Installer management endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.installer import Installer
from app.schemas.installer import InstallerCreate, InstallerUpdate, InstallerResponse

router = APIRouter(prefix="/api/installers", tags=["installers"])


@router.post("", response_model=InstallerResponse, status_code=status.HTTP_201_CREATED)
async def create_installer(
    installer_data: InstallerCreate,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create installer."""
    # Check if SIRET already exists
    result = await db.execute(
        select(Installer).where(Installer.siret == installer_data.siret)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SIRET already exists"
        )
    
    installer = Installer(**installer_data.model_dump())
    db.add(installer)
    await db.commit()
    await db.refresh(installer)
    
    return installer


@router.get("", response_model=list[InstallerResponse])
async def list_installers(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    active: Optional[bool] = Query(None),
    city: Optional[str] = Query(None)
):
    """List installers."""
    query = select(Installer)
    
    if active is not None:
        query = query.where(Installer.active == active)
    if city:
        query = query.where(Installer.city == city)
    
    query = query.order_by(Installer.company_name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{installer_id}", response_model=InstallerResponse)
async def get_installer(
    installer_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get installer details."""
    result = await db.execute(
        select(Installer).where(Installer.id == installer_id)
    )
    installer = result.scalar_one_or_none()
    
    if not installer:
        raise HTTPException(status_code=404, detail="Installer not found")
    
    return installer


@router.patch("/{installer_id}", response_model=InstallerResponse)
async def update_installer(
    installer_id: UUID,
    installer_data: InstallerUpdate,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update installer."""
    result = await db.execute(
        select(Installer).where(Installer.id == installer_id)
    )
    installer = result.scalar_one_or_none()
    
    if not installer:
        raise HTTPException(status_code=404, detail="Installer not found")
    
    update_data = installer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(installer, field, value)
    
    await db.commit()
    await db.refresh(installer)
    
    return installer


@router.post("/{installer_id}/verify-rge")
async def verify_rge(
    installer_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Verify RGE status."""
    result = await db.execute(
        select(Installer).where(Installer.id == installer_id)
    )
    installer = result.scalar_one_or_none()
    
    if not installer:
        raise HTTPException(status_code=404, detail="Installer not found")
    
    # TODO: Implement actual RGE verification logic
    installer.rge_status = "verified"
    await db.commit()
    
    return {"status": "verified", "message": "RGE status verified"}

