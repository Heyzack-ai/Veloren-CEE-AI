"""PDF extraction service."""
import json
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schema import Schema
from app.models.submission import Submission, SubmissionStatus
from app.models.submission_file import SubmissionFile
from app.models.extracted_data import ExtractedData
from app.services.pdf_storage import pdf_storage_service


class PDFExtractionService:
    """Service for extracting data from PDFs based on schemas."""
    
    async def extract_from_pdf(
        self,
        db: AsyncSession,
        submission_id: int,
        schema_id: int,
        file_id: int | None = None
    ) -> Dict[str, Any]:
        """
        Extract data from PDF(s) based on extraction schema.
        
        This is a stub implementation that returns structured mock data.
        In production, this would use libraries like PyPDF2, pdfplumber, or OCR.
        
        Args:
            db: Database session
            submission_id: Submission ID
            schema_id: Schema ID to use for extraction
            file_id: Optional specific file ID to extract from
            
        Returns:
            Dictionary with extraction results
        """
        # Get schema
        schema_result = await db.execute(
            select(Schema).where(Schema.id == schema_id)
        )
        schema = schema_result.scalar_one_or_none()
        
        if not schema:
            raise ValueError(f"Schema {schema_id} not found")
        
        # Get submission
        submission_result = await db.execute(
            select(Submission).where(Submission.id == submission_id)
        )
        submission = submission_result.scalar_one_or_none()
        
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")
        
        # Get files to extract from
        if file_id:
            file_result = await db.execute(
                select(SubmissionFile).where(
                    SubmissionFile.id == file_id,
                    SubmissionFile.submission_id == submission_id
                )
            )
            files = [file_result.scalar_one_or_none()]
        else:
            files_result = await db.execute(
                select(SubmissionFile).where(
                    SubmissionFile.submission_id == submission_id
                )
            )
            files = files_result.scalars().all()
        
        if not files:
            raise ValueError(f"No files found for submission {submission_id}")
        
        # Update submission status
        submission.status = SubmissionStatus.EXTRACTING
        await db.commit()
        
        extraction_config = schema.extraction_config
        extracted_results = []
        
        # Stub extraction logic - in production, this would:
        # 1. Load PDF using PyPDF2/pdfplumber
        # 2. Apply extraction_config rules (field mappings, regex patterns, etc.)
        # 3. Extract structured data
        # 4. Return extracted data
        
        for file in files:
            # Get file content from S3 or local storage
            # In production, use this to load PDF for extraction:
            # file_content = await pdf_storage_service.get_file_content(file.file_path)
            # Then use PyPDF2, pdfplumber, or similar to extract data
            
            # Mock extraction based on config
            extracted_data = self._mock_extract(extraction_config, file.filename)
            
            # Save extracted data
            extracted_record = ExtractedData(
                submission_id=submission_id,
                file_id=file.id,
                extracted_data=extracted_data,
                is_edited=False
            )
            db.add(extracted_record)
            extracted_results.append(extracted_data)
        
        # Update submission status
        submission.status = SubmissionStatus.EXTRACTED
        await db.commit()
        
        return {
            "submission_id": submission_id,
            "schema_id": schema_id,
            "extracted_data": extracted_results,
            "files_processed": len(files)
        }
    
    def _mock_extract(self, config: Dict[str, Any], filename: str) -> Dict[str, Any]:
        """
        Mock extraction logic.
        
        Args:
            config: Extraction configuration
            filename: Name of file being extracted
            
        Returns:
            Mock extracted data
        """
        # This is a stub - in production, implement actual PDF extraction
        # based on the extraction_config structure
        result = {}
        
        # Example: if config has fields, create mock data for them
        if "fields" in config:
            for field in config["fields"]:
                field_name = field.get("name", "unknown")
                field_type = field.get("type", "string")
                
                if field_type == "string":
                    result[field_name] = f"Extracted_{field_name}_from_{filename}"
                elif field_type == "number":
                    result[field_name] = 12345
                elif field_type == "date":
                    result[field_name] = "2024-01-01"
                else:
                    result[field_name] = None
        
        # If no fields in config, return basic structure
        if not result:
            result = {
                "filename": filename,
                "extracted_at": "2024-01-01T00:00:00Z",
                "status": "extracted"
            }
        
        return result


pdf_extraction_service = PDFExtractionService()

