"""PDF storage service with AWS S3 support."""
import uuid
from pathlib import Path
from typing import Optional, Protocol
from uuid import UUID
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from app.core.config import settings


class FileLike(Protocol):
    """Protocol for file-like objects."""
    filename: Optional[str]
    content_type: Optional[str]
    
    async def read(self) -> bytes:
        """Read file content."""
        ...


class PDFStorageService:
    """Service for handling PDF file storage with AWS S3."""
    
    def __init__(self):
        """Initialize storage service."""
        self.use_s3 = settings.USE_S3
        
        if self.use_s3:
            # Initialize S3 client
            s3_config = {
                "region_name": settings.AWS_REGION,
            }
            
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                s3_config["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                s3_config["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
            
            if settings.S3_ENDPOINT_URL:
                s3_config["endpoint_url"] = settings.S3_ENDPOINT_URL
            
            self.s3_client = boto3.client("s3", **s3_config)
            self.bucket_name = settings.S3_BUCKET_NAME
            
            # Ensure bucket exists
            self._ensure_bucket_exists()
        else:
            # Local storage fallback
            self.upload_dir = Path(settings.UPLOAD_DIR)
            self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def _ensure_bucket_exists(self):
        """Ensure S3 bucket exists, create if it doesn't."""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "404":
                # Bucket doesn't exist, create it
                try:
                    if settings.AWS_REGION == "us-east-1":
                        self.s3_client.create_bucket(Bucket=self.bucket_name)
                    else:
                        self.s3_client.create_bucket(
                            Bucket=self.bucket_name,
                            CreateBucketConfiguration={"LocationConstraint": settings.AWS_REGION}
                        )
                except ClientError as create_error:
                    raise Exception(f"Failed to create S3 bucket: {create_error}")
            else:
                raise Exception(f"Failed to access S3 bucket: {e}")
    
    def _get_s3_key(self, dossier_id: UUID, filename: str) -> str:
        """Generate S3 key for a file."""
        return f"dossiers/{dossier_id}/{filename}"
    
    async def save_file(self, file: FileLike, dossier_id: UUID) -> tuple[str, int]:
        """
        Save uploaded PDF file to S3 or local storage.
        
        Args:
            file: Uploaded file
            dossier_id: Dossier ID
            
        Returns:
            Tuple of (file_path/s3_key, file_size)
        """
        # Generate unique filename
        file_ext = Path(file.filename or "file").suffix or ".pdf"
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Read file content
        if hasattr(file, 'read'):
            content = await file.read()
        else:
            content = file
        file_size = len(content)
        
        if self.use_s3:
            # Upload to S3
            s3_key = self._get_s3_key(dossier_id, unique_filename)
            
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=content,
                    ContentType=getattr(file, 'content_type', None) or "application/pdf",
                    Metadata={
                        "original_filename": getattr(file, 'filename', None) or "unknown",
                        "dossier_id": str(dossier_id)
                    }
                )
                # Return S3 key as file_path for database storage
                return s3_key, file_size
            except (ClientError, BotoCoreError) as e:
                raise Exception(f"Failed to upload file to S3: {e}")
        else:
            # Local storage fallback
            dossier_dir = self.upload_dir / str(dossier_id)
            dossier_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = dossier_dir / unique_filename
            with open(file_path, "wb") as f:
                f.write(content)
            
            return str(file_path), file_size
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from S3 or local storage.
        
        Args:
            file_path: S3 key or local file path
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            if self.use_s3:
                # Delete from S3
                try:
                    self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_path)
                    return True
                except (ClientError, BotoCoreError):
                    return False
            else:
                # Delete from local storage
                path = Path(file_path)
                if path.exists():
                    path.unlink()
                    return True
                return False
        except Exception:
            return False
    
    async def get_file_url(self, file_path: str, expiration: int = 3600) -> Optional[str]:
        """
        Get a presigned URL for downloading a file from S3.
        
        Args:
            file_path: S3 key
            expiration: URL expiration time in seconds (default 1 hour)
            
        Returns:
            Presigned URL or None if using local storage
        """
        if not self.use_s3:
            return None
        
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": file_path},
                ExpiresIn=expiration
            )
            return url
        except (ClientError, BotoCoreError) as e:
            raise Exception(f"Failed to generate presigned URL: {e}")
    
    async def get_file_content(self, file_path: str) -> Optional[bytes]:
        """
        Get file content from S3 or local storage.
        
        Args:
            file_path: S3 key or local file path
            
        Returns:
            File content as bytes or None
        """
        try:
            if self.use_s3:
                # Get from S3
                try:
                    response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_path)
                    return response["Body"].read()
                except (ClientError, BotoCoreError):
                    return None
            else:
                # Get from local storage
                path = Path(file_path)
                if path.exists():
                    with open(path, "rb") as f:
                        return f.read()
                return None
        except Exception:
            return None
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in S3 or local storage.
        
        Args:
            file_path: S3 key or local file path
            
        Returns:
            True if exists, False otherwise
        """
        try:
            if self.use_s3:
                # Check in S3
                try:
                    self.s3_client.head_object(Bucket=self.bucket_name, Key=file_path)
                    return True
                except ClientError as e:
                    if e.response.get("Error", {}).get("Code") == "404":
                        return False
                    raise
            else:
                # Check in local storage
                return Path(file_path).exists()
        except Exception:
            return False


pdf_storage_service = PDFStorageService()
