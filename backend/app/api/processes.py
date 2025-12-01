"""Process configuration endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.process import Process
from app.schemas.process import ProcessCreate, ProcessUpdate, ProcessResponse

router = APIRouter(prefix="/api/processes", tags=["processes"])


@router.post("", response_model=ProcessResponse, status_code=status.HTTP_201_CREATED)
async def create_process(
    process_data: ProcessCreate,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create CEE process."""
    # Check if code already exists
    result = await db.execute(
        select(Process).where(Process.code == process_data.code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Process code already exists"
        )
    
    process = Process(**process_data.model_dump())
    db.add(process)
    await db.commit()
    await db.refresh(process)
    
    return process


@router.get("", response_model=list[ProcessResponse])
async def list_processes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_active: Optional[bool] = Query(None),
    category: Optional[str] = Query(None)
):
    """List processes."""
    query = select(Process)
    
    if is_active is not None:
        query = query.where(Process.is_active == is_active)
    if category:
        query = query.where(Process.category == category)
    
    query = query.order_by(Process.code)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{process_id}", response_model=ProcessResponse)
async def get_process(
    process_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get process details."""
    result = await db.execute(
        select(Process).where(Process.id == process_id)
    )
    process = result.scalar_one_or_none()
    
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    
    return process


@router.patch("/{process_id}", response_model=ProcessResponse)
async def update_process(
    process_id: UUID,
    process_data: ProcessUpdate,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update process."""
    result = await db.execute(
        select(Process).where(Process.id == process_id)
    )
    process = result.scalar_one_or_none()
    
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    
    update_data = process_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(process, field, value)
    
    await db.commit()
    await db.refresh(process)
    
    return process


@router.post("/{process_id}/clone", response_model=ProcessResponse, status_code=status.HTTP_201_CREATED)
async def clone_process(
    process_id: UUID,
    new_code: str,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Clone process."""
    result = await db.execute(
        select(Process).where(Process.id == process_id)
    )
    original = result.scalar_one_or_none()
    
    if not original:
        raise HTTPException(status_code=404, detail="Process not found")
    
    # Check if new code exists
    check_result = await db.execute(
        select(Process).where(Process.code == new_code)
    )
    if check_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Process code already exists"
        )
    
    # Create clone
    clone_data = {
        "code": new_code,
        "name": original.name,
        "category": original.category,
        "description": original.description,
        "version": "1.0",
        "is_coup_de_pouce": original.is_coup_de_pouce,
        "valid_from": original.valid_from,
        "valid_until": original.valid_until,
        "required_documents": original.required_documents,
        "is_active": False
    }
    
    clone = Process(**clone_data)
    db.add(clone)
    await db.commit()
    await db.refresh(clone)
    
    return clone

