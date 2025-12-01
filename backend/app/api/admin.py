"""Admin endpoints."""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.document_type import DocumentType
from app.models.schema import Schema
from app.models.rule import Rule
from app.models.submission import Submission, SubmissionStatus
from app.models.activity_log import ActivityLog
from app.schemas.auth import UserCreate, UserResponse
from app.schemas.document_type import DocumentTypeCreate, DocumentTypeUpdate, DocumentTypeResponse
from app.schemas.schema import SchemaCreate, SchemaUpdate, SchemaResponse
from app.schemas.rule import RuleCreate, RuleUpdate, RuleResponse
from app.schemas.report import SystemReportResponse
from app.core.security import get_password_hash
from app.services.audit import audit_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


# User Management
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Create a new user."""
    # Check if username or email already exists
    existing_user = await db.execute(
        select(User).where(
            (User.username == user_data.username) | (User.email == user_data.email)
        )
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        role=user_data.role,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Log audit
    await audit_service.log_action(
        db, current_user.id, "create_user", "user", new_user.id,
        {"username": new_user.username, "role": new_user.role.value}
    )
    
    return new_user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """List all users."""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


# Document Type Management
@router.post("/document-types", response_model=DocumentTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_document_type(
    doc_type_data: DocumentTypeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Create a new document type."""
    # Check if name already exists
    existing = await db.execute(
        select(DocumentType).where(DocumentType.name == doc_type_data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document type name already exists"
        )
    
    new_doc_type = DocumentType(
        name=doc_type_data.name,
        description=doc_type_data.description,
        required_pdf_count=doc_type_data.required_pdf_count,
        created_by=current_user.id
    )
    db.add(new_doc_type)
    await db.commit()
    await db.refresh(new_doc_type)
    
    await audit_service.log_action(
        db, current_user.id, "create_document_type", "document_type", new_doc_type.id
    )
    
    return new_doc_type


@router.get("/document-types", response_model=List[DocumentTypeResponse])
async def list_document_types(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """List all document types."""
    result = await db.execute(select(DocumentType))
    doc_types = result.scalars().all()
    return doc_types


@router.put("/document-types/{doc_type_id}", response_model=DocumentTypeResponse)
async def update_document_type(
    doc_type_id: int,
    doc_type_data: DocumentTypeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Update a document type."""
    result = await db.execute(
        select(DocumentType).where(DocumentType.id == doc_type_id)
    )
    doc_type = result.scalar_one_or_none()
    if not doc_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document type not found"
        )
    
    if doc_type_data.name:
        doc_type.name = doc_type_data.name
    if doc_type_data.description is not None:
        doc_type.description = doc_type_data.description
    if doc_type_data.required_pdf_count:
        doc_type.required_pdf_count = doc_type_data.required_pdf_count
    
    await db.commit()
    await db.refresh(doc_type)
    
    await audit_service.log_action(
        db, current_user.id, "update_document_type", "document_type", doc_type_id
    )
    
    return doc_type


# Schema Management
@router.post("/schemas", response_model=SchemaResponse, status_code=status.HTTP_201_CREATED)
async def create_schema(
    schema_data: SchemaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Create a new extraction schema."""
    # Verify document type exists
    doc_type_result = await db.execute(
        select(DocumentType).where(DocumentType.id == schema_data.document_type_id)
    )
    if not doc_type_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document type not found"
        )
    
    new_schema = Schema(
        name=schema_data.name,
        document_type_id=schema_data.document_type_id,
        extraction_config=schema_data.extraction_config,
        version=schema_data.version,
        created_by=current_user.id
    )
    db.add(new_schema)
    await db.commit()
    await db.refresh(new_schema)
    
    await audit_service.log_action(
        db, current_user.id, "create_schema", "schema", new_schema.id
    )
    
    return new_schema


@router.get("/schemas", response_model=List[SchemaResponse])
async def list_schemas(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    document_type_id: int | None = None
):
    """List all schemas, optionally filtered by document type."""
    query = select(Schema)
    if document_type_id:
        query = query.where(Schema.document_type_id == document_type_id)
    
    result = await db.execute(query)
    schemas = result.scalars().all()
    return schemas


@router.put("/schemas/{schema_id}", response_model=SchemaResponse)
async def update_schema(
    schema_id: int,
    schema_data: SchemaUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Update a schema."""
    result = await db.execute(select(Schema).where(Schema.id == schema_id))
    schema = result.scalar_one_or_none()
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schema not found"
        )
    
    if schema_data.name:
        schema.name = schema_data.name
    if schema_data.extraction_config:
        schema.extraction_config = schema_data.extraction_config
    if schema_data.is_active is not None:
        schema.is_active = schema_data.is_active
    
    await db.commit()
    await db.refresh(schema)
    
    await audit_service.log_action(
        db, current_user.id, "update_schema", "schema", schema_id
    )
    
    return schema


# Rule Management
@router.post("/rules", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_data: RuleCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Create a new validation rule."""
    # Verify document type exists
    doc_type_result = await db.execute(
        select(DocumentType).where(DocumentType.id == rule_data.document_type_id)
    )
    if not doc_type_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document type not found"
        )
    
    new_rule = Rule(
        name=rule_data.name,
        document_type_id=rule_data.document_type_id,
        rule_config=rule_data.rule_config,
        description=rule_data.description,
        created_by=current_user.id
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    
    await audit_service.log_action(
        db, current_user.id, "create_rule", "rule", new_rule.id
    )
    
    return new_rule


@router.get("/rules", response_model=List[RuleResponse])
async def list_rules(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    document_type_id: int | None = None
):
    """List all rules, optionally filtered by document type."""
    query = select(Rule)
    if document_type_id:
        query = query.where(Rule.document_type_id == document_type_id)
    
    result = await db.execute(query)
    rules = result.scalars().all()
    return rules


@router.put("/rules/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: int,
    rule_data: RuleUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Update a rule."""
    result = await db.execute(select(Rule).where(Rule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    if rule_data.name:
        rule.name = rule_data.name
    if rule_data.rule_config:
        rule.rule_config = rule_data.rule_config
    if rule_data.description is not None:
        rule.description = rule_data.description
    if rule_data.is_active is not None:
        rule.is_active = rule_data.is_active
    
    await db.commit()
    await db.refresh(rule)
    
    await audit_service.log_action(
        db, current_user.id, "update_rule", "rule", rule_id
    )
    
    return rule


# Reports
@router.get("/reports/system", response_model=SystemReportResponse)
async def get_system_report(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """Get system-wide reports."""
    # Count users
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar()
    
    # Count document types
    doc_types_result = await db.execute(select(func.count(DocumentType.id)))
    total_document_types = doc_types_result.scalar()
    
    # Count submissions
    submissions_result = await db.execute(select(func.count(Submission.id)))
    total_submissions = submissions_result.scalar()
    
    # Submissions by status
    status_result = await db.execute(
        select(Submission.status, func.count(Submission.id))
        .group_by(Submission.status)
    )
    submissions_by_status = {status.value: count for status, count in status_result.all()}
    
    # Submissions by document type
    doc_type_result = await db.execute(
        select(DocumentType.name, func.count(Submission.id))
        .join(Submission, DocumentType.id == Submission.document_type_id)
        .group_by(DocumentType.name)
    )
    submissions_by_document_type = {name: count for name, count in doc_type_result.all()}
    
    # Recent activity (last 10 activity logs)
    recent_activity_result = await db.execute(
        select(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
    )
    recent_activity = [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action_type,
            "resource_type": log.entity_type,
            "resource_id": log.entity_id,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in recent_activity_result.scalars().all()
    ]
    
    return SystemReportResponse(
        total_users=total_users,
        total_document_types=total_document_types,
        total_submissions=total_submissions,
        submissions_by_status=submissions_by_status,
        submissions_by_document_type=submissions_by_document_type,
        recent_activity=recent_activity
    )

