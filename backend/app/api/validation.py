"""Validation endpoints."""
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/dossiers", tags=["validation"])


@router.get("/{dossier_id}/validation")
async def get_validation_state(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.VALIDATOR, UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get validation state."""
    # TODO: Implement validation state retrieval
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{dossier_id}/fields")
async def get_extracted_fields(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.VALIDATOR, UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get extracted fields."""
    # TODO: Implement extracted fields retrieval
    return {"fields": []}


@router.patch("/{dossier_id}/fields/{field_id}")
async def update_field(
    dossier_id: UUID,
    field_id: UUID,
    field_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update field value."""
    # TODO: Implement field update
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/{dossier_id}/fields/{field_id}/confirm")
async def confirm_field(
    dossier_id: UUID,
    field_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Confirm field."""
    # TODO: Implement field confirmation
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/{dossier_id}/approve")
async def approve_dossier(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Approve dossier."""
    # TODO: Implement dossier approval
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/{dossier_id}/reject")
async def reject_dossier(
    dossier_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.VALIDATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Reject dossier."""
    # TODO: Implement dossier rejection
    raise HTTPException(status_code=501, detail="Not implemented")

