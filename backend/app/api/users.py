"""User management endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create user."""
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.get("", response_model=list[UserResponse])
async def list_users(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    role: Optional[UserRole] = Query(None),
    active: Optional[bool] = Query(None)
):
    """List users."""
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    if active is not None:
        query = query.where(User.active == active)
    
    query = query.order_by(User.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get user details."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update user."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Check email uniqueness if updating email
    if "email" in update_data:
        email_result = await db.execute(
            select(User).where(User.email == update_data["email"]).where(User.id != user_id)
        )
        if email_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/{user_id}/deactivate")
async def deactivate_user(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Deactivate user."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.active = False
    await db.commit()
    
    return {"message": "User deactivated"}


@router.post("/{user_id}/activate")
async def activate_user(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Activate user."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.active = True
    await db.commit()
    
    return {"message": "User activated"}


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: UUID,
    new_password: str,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Admin reset user password."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = get_password_hash(new_password)
    await db.commit()
    
    return {"message": "Password reset"}

