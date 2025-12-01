"""Field schema endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.field_schema import FieldSchema

router = APIRouter(prefix="/api/schemas", tags=["schemas"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_schema(
    schema_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create field schema."""
    schema = FieldSchema(**schema_data)
    db.add(schema)
    await db.commit()
    await db.refresh(schema)
    
    return schema


@router.get("")
async def list_schemas(
    document_type_id: Optional[UUID] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List field schemas."""
    query = select(FieldSchema)
    
    if document_type_id:
        query = query.where(FieldSchema.document_type_id == document_type_id)
    if is_active is not None:
        query = query.where(FieldSchema.is_active == is_active)
    
    query = query.order_by(FieldSchema.display_order, FieldSchema.field_name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{schema_id}")
async def get_schema(
    schema_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get schema details."""
    result = await db.execute(
        select(FieldSchema).where(FieldSchema.id == schema_id)
    )
    schema = result.scalar_one_or_none()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    return schema


@router.patch("/{schema_id}")
async def update_schema(
    schema_id: UUID,
    schema_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update schema."""
    result = await db.execute(
        select(FieldSchema).where(FieldSchema.id == schema_id)
    )
    schema = result.scalar_one_or_none()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    for field, value in schema_data.items():
        if hasattr(schema, field):
            setattr(schema, field, value)
    
    await db.commit()
    await db.refresh(schema)
    
    return schema


@router.delete("/{schema_id}")
async def delete_schema(
    schema_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete schema."""
    result = await db.execute(
        select(FieldSchema).where(FieldSchema.id == schema_id)
    )
    schema = result.scalar_one_or_none()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    await db.delete(schema)
    await db.commit()
    
    return {"message": "Schema deleted"}


@router.get("/{schema_id}/fields")
async def get_schema_fields(
    schema_id: UUID,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get schema fields."""
    result = await db.execute(
        select(FieldSchema).where(FieldSchema.id == schema_id)
    )
    schema = result.scalar_one_or_none()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Get all fields for this document type
    fields_result = await db.execute(
        select(FieldSchema).where(FieldSchema.document_type_id == schema.document_type_id)
        .order_by(FieldSchema.display_order, FieldSchema.field_name)
    )
    fields = fields_result.scalars().all()
    
    return fields

