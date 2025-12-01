"""Installer endpoints."""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.document_type import DocumentType
from app.models.submission import Submission, SubmissionStatus
from app.models.submission_file import SubmissionFile
from app.schemas.submission import SubmissionCreate, SubmissionResponse, SubmissionListResponse
from app.services.pdf_storage import pdf_storage_service
from app.services.audit import audit_service

router = APIRouter(prefix="/api/installer", tags=["installer"])


@router.post("/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission_data: SubmissionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.INSTALLER))]
):
    """Create a new document submission."""
    # Verify document type exists
    doc_type_result = await db.execute(
        select(DocumentType).where(DocumentType.id == submission_data.document_type_id)
    )
    doc_type = doc_type_result.scalar_one_or_none()
    if not doc_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document type not found"
        )
    
    # Create submission
    new_submission = Submission(
        document_type_id=submission_data.document_type_id,
        installer_id=current_user.id,
        status=SubmissionStatus.PENDING
    )
    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)
    
    await audit_service.log_action(
        db, current_user.id, "create_submission", "submission", new_submission.id
    )
    
    return new_submission


@router.post("/submissions/{submission_id}/upload", response_model=SubmissionResponse)
async def upload_pdf(
    submission_id: int,
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.INSTALLER))]
):
    """Upload a PDF file to a submission."""
    # Verify submission exists and belongs to user
    submission_result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.installer_id == current_user.id
        )
    )
    submission = submission_result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found or access denied"
        )
    
    # Check if submission is in a state that allows uploads
    if submission.status == SubmissionStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload to approved submission"
        )
    
    # Verify file is PDF
    if not file.content_type or "pdf" not in file.content_type.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF"
        )
    
    # Get document type to check required count
    doc_type_result = await db.execute(
        select(DocumentType).where(DocumentType.id == submission.document_type_id)
    )
    doc_type = doc_type_result.scalar_one_or_none()
    
    # Count existing files
    files_result = await db.execute(
        select(SubmissionFile).where(SubmissionFile.submission_id == submission_id)
    )
    existing_files = files_result.scalars().all()
    
    # If rejected, allow re-upload (delete old files if needed)
    if submission.status == SubmissionStatus.REJECTED:
        # Delete old files
        for old_file in existing_files:
            await pdf_storage_service.delete_file(old_file.file_path)
            await db.delete(old_file)
        existing_files = []
        submission.status = SubmissionStatus.PENDING
    
    # Check if we've reached the required count
    if len(existing_files) >= doc_type.required_pdf_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {doc_type.required_pdf_count} PDF(s) already uploaded"
        )
    
    # Save file
    file_path, file_size = await pdf_storage_service.save_file(file, submission_id)
    
    # Create file record
    new_file = SubmissionFile(
        submission_id=submission_id,
        filename=file.filename or "uploaded.pdf",
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "application/pdf"
    )
    db.add(new_file)
    
    # Update submission status if we've reached required count
    if len(existing_files) + 1 >= doc_type.required_pdf_count:
        submission.status = SubmissionStatus.UPLOADED
    
    await db.commit()
    await db.refresh(submission)
    
    # Load files for response
    files_result = await db.execute(
        select(SubmissionFile).where(SubmissionFile.submission_id == submission_id)
    )
    submission.files = files_result.scalars().all()
    
    await audit_service.log_action(
        db, current_user.id, "upload_pdf", "submission", submission_id,
        {"filename": file.filename, "file_size": file_size}
    )
    
    return submission


@router.post("/submissions/{submission_id}/submit")
async def submit_submission(
    submission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.INSTALLER))]
):
    """Submit a submission for validation."""
    # Verify submission exists and belongs to user
    submission_result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.installer_id == current_user.id
        )
    )
    submission = submission_result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found or access denied"
        )
    
    # Get document type
    doc_type_result = await db.execute(
        select(DocumentType).where(DocumentType.id == submission.document_type_id)
    )
    doc_type = doc_type_result.scalar_one_or_none()
    
    # Count files
    files_result = await db.execute(
        select(SubmissionFile).where(SubmissionFile.submission_id == submission_id)
    )
    files = files_result.scalars().all()
    
    if len(files) < doc_type.required_pdf_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Required {doc_type.required_pdf_count} PDF(s), but only {len(files)} uploaded"
        )
    
    if submission.status != SubmissionStatus.UPLOADED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Submission must be in UPLOADED status, current status: {submission.status.value}"
        )
    
    # Status remains UPLOADED - validator will change it when they start working on it
    await db.commit()
    
    await audit_service.log_action(
        db, current_user.id, "submit_submission", "submission", submission_id
    )
    
    return {"message": "Submission submitted successfully", "submission_id": submission_id}


@router.get("/submissions", response_model=List[SubmissionListResponse])
async def list_my_submissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.INSTALLER))]
):
    """List all submissions created by current installer."""
    result = await db.execute(
        select(Submission).where(Submission.installer_id == current_user.id)
        .order_by(Submission.created_at.desc())
    )
    submissions = result.scalars().all()
    return submissions


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.INSTALLER))]
):
    """Get a specific submission."""
    result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.installer_id == current_user.id
        )
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found or access denied"
        )
    
    # Load files
    files_result = await db.execute(
        select(SubmissionFile).where(SubmissionFile.submission_id == submission_id)
    )
    submission.files = files_result.scalars().all()
    
    return submission


@router.get("/submissions/{submission_id}/files/{file_id}/download")
async def download_file(
    submission_id: int,
    file_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.INSTALLER))]
):
    """Get download URL for a file (presigned URL for S3, or direct path for local)."""
    # Verify submission belongs to user
    submission_result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.installer_id == current_user.id
        )
    )
    if not submission_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found or access denied"
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
    download_url = await pdf_storage_service.get_file_url(file_record.file_path)
    
    if download_url:
        return {"download_url": download_url, "expires_in": 3600}
    else:
        # For local storage, return file path info
        return {
            "file_path": file_record.file_path,
            "message": "File stored locally. Use direct file access."
        }

