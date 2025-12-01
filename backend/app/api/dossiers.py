"""Dossier management endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.dossier import Dossier, DossierStatus
from app.models.installer import Installer
from app.models.process import Process

router = APIRouter(prefix="/api/dossiers", tags=["dossiers"])


@router.post("")
async def create_dossier(
    dossier_data: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create new dossier."""
    # TODO: Implement dossier creation
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("")
async def list_dossiers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[DossierStatus] = None,
    installer_id: Optional[UUID] = None,
    process_id: Optional[UUID] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """List dossiers with filters."""
    # TODO: Implement dossier listing with filters
    return {"dossiers": [], "total": 0, "page": page, "limit": limit}


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


@router.patch("/{dossier_id}")
async def update_dossier(
    dossier_id: UUID,
    dossier_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR, UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update dossier."""
    # TODO: Implement dossier update
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete("/{dossier_id}")
async def delete_dossier(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete dossier."""
    # TODO: Implement dossier deletion
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/{dossier_id}/assign")
async def assign_validator(
    dossier_id: UUID,
    validator_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Assign validator to dossier."""
    # TODO: Implement validator assignment
    raise HTTPException(status_code=501, detail="Not implemented")

