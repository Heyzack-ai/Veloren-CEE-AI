"""Validation rules endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.validation_rule import ValidationRule

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create validation rule."""
    # Check if code already exists
    if "code" in rule_data:
        result = await db.execute(
            select(ValidationRule).where(ValidationRule.code == rule_data["code"])
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rule code already exists"
            )
    
    rule = ValidationRule(**rule_data, created_by=current_user.id)
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    
    return rule


@router.get("")
async def list_rules(
    process_id: Optional[UUID] = Query(None),
    document_type_id: Optional[UUID] = Query(None),
    rule_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List validation rules."""
    query = select(ValidationRule)
    
    if process_id:
        query = query.where(ValidationRule.process_id == process_id)
    if document_type_id:
        query = query.where(ValidationRule.document_type_id == document_type_id)
    if rule_type:
        query = query.where(ValidationRule.rule_type == rule_type)
    if is_active is not None:
        query = query.where(ValidationRule.is_active == is_active)
    
    query = query.order_by(ValidationRule.code)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{rule_id}")
async def get_rule(
    rule_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get rule details."""
    result = await db.execute(
        select(ValidationRule).where(ValidationRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    return rule


@router.patch("/{rule_id}")
async def update_rule(
    rule_id: UUID,
    rule_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update rule."""
    result = await db.execute(
        select(ValidationRule).where(ValidationRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Check code uniqueness if updating code
    if "code" in rule_data and rule_data["code"] != rule.code:
        code_result = await db.execute(
            select(ValidationRule).where(ValidationRule.code == rule_data["code"]).where(ValidationRule.id != rule_id)
        )
        if code_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rule code already exists"
            )
    
    for field, value in rule_data.items():
        if hasattr(rule, field):
            setattr(rule, field, value)
    
    await db.commit()
    await db.refresh(rule)
    
    return rule


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete rule."""
    result = await db.execute(
        select(ValidationRule).where(ValidationRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    await db.delete(rule)
    await db.commit()
    
    return {"message": "Rule deleted"}


@router.post("/{rule_id}/test")
async def test_rule(
    rule_id: UUID,
    test_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Test rule with sample data."""
    result = await db.execute(
        select(ValidationRule).where(ValidationRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # TODO: Implement rule testing with actual evaluator
    return {"passed": True, "message": "Rule test not yet implemented"}


@router.post("/{rule_id}/toggle")
async def toggle_rule(
    rule_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Enable/disable rule."""
    result = await db.execute(
        select(ValidationRule).where(ValidationRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.is_active = not rule.is_active
    await db.commit()
    await db.refresh(rule)
    
    return rule

