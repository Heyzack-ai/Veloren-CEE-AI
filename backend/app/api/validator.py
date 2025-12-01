"""Validator endpoints."""
from typing import Annotated, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.submission import Submission, SubmissionStatus
from app.models.submission_file import SubmissionFile
from app.models.extracted_data import ExtractedData
from app.models.schema import Schema
from app.models.rule import Rule
from app.models.rule_result import RuleResult
from app.schemas.submission import SubmissionResponse, SubmissionListResponse
from app.schemas.extraction import ExtractedDataResponse, ExtractedDataUpdate, ExtractionRunRequest
from app.schemas.validation import ValidationRunRequest, ValidationResponse, RuleResultResponse
from app.services.pdf_extraction import pdf_extraction_service
from app.services.validation_engine import validation_engine
from app.services.audit import audit_service

router = APIRouter(prefix="/api/validator", tags=["validator"])


@router.get("/submissions", response_model=List[SubmissionListResponse])
async def list_submissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))],
    status_filter: SubmissionStatus | None = None
):
    """List all submissions available for validation."""
    query = select(Submission).where(
        Submission.status.in_([
            SubmissionStatus.UPLOADED,
            SubmissionStatus.EXTRACTING,
            SubmissionStatus.EXTRACTED,
            SubmissionStatus.VALIDATING
        ])
    )
    
    if status_filter:
        query = query.where(Submission.status == status_filter)
    
    query = query.order_by(Submission.created_at.desc())
    
    result = await db.execute(query)
    submissions = result.scalars().all()
    return submissions


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))]
):
    """Get a specific submission for validation."""
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Load files
    files_result = await db.execute(
        select(SubmissionFile).where(SubmissionFile.submission_id == submission_id)
    )
    submission.files = files_result.scalars().all()
    
    return submission


@router.post("/extract", status_code=status.HTTP_200_OK)
async def run_extraction(
    extraction_request: ExtractionRunRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))]
):
    """Run extraction on a submission using a schema."""
    # Verify submission exists
    submission_result = await db.execute(
        select(Submission).where(Submission.id == extraction_request.submission_id)
    )
    submission = submission_result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Verify schema exists and matches document type
    schema_result = await db.execute(
        select(Schema).where(
            Schema.id == extraction_request.schema_id,
            Schema.document_type_id == submission.document_type_id,
            Schema.is_active == True
        )
    )
    schema = schema_result.scalar_one_or_none()
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schema not found or not applicable to this document type"
        )
    
    # Assign validator if not already assigned
    if not submission.validator_id:
        submission.validator_id = current_user.id
    
    # Run extraction
    result = await pdf_extraction_service.extract_from_pdf(
        db,
        extraction_request.submission_id,
        extraction_request.schema_id
    )
    
    await audit_service.log_action(
        db, current_user.id, "run_extraction", "submission", extraction_request.submission_id,
        {"schema_id": extraction_request.schema_id}
    )
    
    return result


@router.get("/submissions/{submission_id}/extracted-data", response_model=List[ExtractedDataResponse])
async def get_extracted_data(
    submission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))]
):
    """Get extracted data for a submission."""
    # Verify submission exists
    submission_result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    if not submission_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    result = await db.execute(
        select(ExtractedData).where(ExtractedData.submission_id == submission_id)
    )
    extracted_data = result.scalars().all()
    return extracted_data


@router.put("/extracted-data/{extracted_data_id}", response_model=ExtractedDataResponse)
async def update_extracted_data(
    extracted_data_id: int,
    data_update: ExtractedDataUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))]
):
    """Update extracted data."""
    result = await db.execute(
        select(ExtractedData).where(ExtractedData.id == extracted_data_id)
    )
    extracted_data = result.scalar_one_or_none()
    if not extracted_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extracted data not found"
        )
    
    extracted_data.extracted_data = data_update.extracted_data
    extracted_data.is_edited = True
    extracted_data.edited_by = current_user.id
    
    await db.commit()
    await db.refresh(extracted_data)
    
    await audit_service.log_action(
        db, current_user.id, "update_extracted_data", "extracted_data", extracted_data_id
    )
    
    return extracted_data


@router.post("/validate", response_model=ValidationResponse)
async def run_validation(
    validation_request: ValidationRunRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))]
):
    """Run validation rules on a submission."""
    # Verify submission exists
    submission_result = await db.execute(
        select(Submission).where(Submission.id == validation_request.submission_id)
    )
    submission = submission_result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Run validation
    result = await validation_engine.run_validation(
        db,
        validation_request.submission_id,
        validation_request.rule_ids
    )
    
    # Get rule results for response
    rule_ids = validation_request.rule_ids
    query = select(RuleResult).where(
        RuleResult.submission_id == validation_request.submission_id
    )
    if rule_ids:
        query = query.where(RuleResult.rule_id.in_(rule_ids))
    
    results_query = await db.execute(query.order_by(RuleResult.executed_at.desc()))
    rule_results = results_query.scalars().all()
    
    await audit_service.log_action(
        db, current_user.id, "run_validation", "submission", validation_request.submission_id
    )
    
    return ValidationResponse(
        submission_id=validation_request.submission_id,
        results=[
            RuleResultResponse(
                id=r.id,
                submission_id=r.submission_id,
                rule_id=r.rule_id,
                passed=r.passed,
                result_data=r.result_data,
                error_message=r.error_message,
                executed_at=r.executed_at
            )
            for r in rule_results
        ],
        all_passed=result["all_passed"]
    )


@router.get("/submissions/{submission_id}/validation-results", response_model=List[RuleResultResponse])
async def get_validation_results(
    submission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))]
):
    """Get validation results for a submission."""
    result = await db.execute(
        select(RuleResult).where(RuleResult.submission_id == submission_id)
        .order_by(RuleResult.executed_at.desc())
    )
    rule_results = result.scalars().all()
    return [
        RuleResultResponse(
            id=r.id,
            submission_id=r.submission_id,
            rule_id=r.rule_id,
            passed=r.passed,
            result_data=r.result_data,
            error_message=r.error_message,
            executed_at=r.executed_at
        )
        for r in rule_results
    ]


@router.post("/submissions/{submission_id}/approve")
async def approve_submission(
    submission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))],
    notes: str | None = None
):
    """Approve a submission."""
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    submission.status = SubmissionStatus.APPROVED
    submission.validator_id = current_user.id
    submission.reviewed_at = datetime.utcnow()
    if notes:
        submission.notes = notes
    
    await db.commit()
    
    await audit_service.log_action(
        db, current_user.id, "approve_submission", "submission", submission_id
    )
    
    return {"message": "Submission approved", "submission_id": submission_id}


@router.post("/submissions/{submission_id}/reject")
async def reject_submission(
    submission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))],
    notes: str | None = None
):
    """Reject a submission."""
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    submission.status = SubmissionStatus.REJECTED
    submission.validator_id = current_user.id
    submission.reviewed_at = datetime.utcnow()
    if notes:
        submission.notes = notes
    
    await db.commit()
    
    await audit_service.log_action(
        db, current_user.id, "reject_submission", "submission", submission_id,
        {"notes": notes}
    )
    
    return {"message": "Submission rejected", "submission_id": submission_id}


@router.get("/submissions/{submission_id}/files/{file_id}/download")
async def download_file(
    submission_id: int,
    file_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.VALIDATOR))]
):
    """Get download URL for a file (presigned URL for S3, or direct path for local)."""
    # Verify submission exists
    submission_result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    if not submission_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Get file
    file_result = await db.execute(
        select(SubmissionFile).where(
            SubmissionFile.id == file_id,
            SubmissionFile.submission_id == submission_id
        )
    )
    file_record = file_result.scalar_one_or_none()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get download URL
    from app.services.pdf_storage import pdf_storage_service
    download_url = await pdf_storage_service.get_file_url(file_record.file_path)
    
    if download_url:
        return {"download_url": download_url, "expires_in": 3600}
    else:
        # For local storage, return file path info
        return {
            "file_path": file_record.file_path,
            "message": "File stored locally. Use direct file access."
        }

