"""Application configuration settings."""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Database - DATABASE_URL (hardcoded default, can be overridden by environment variable)
    # Format: postgresql+asyncpg://user:password@host:port/database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@15.237.138.96:5432/postgres"
    
    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate DATABASE_URL format when it's loaded from environment."""
        if not v:
            raise ValueError("DATABASE_URL environment variable is not set")
        
        # Check format - must use postgresql+asyncpg://
        if v.startswith("postgres://"):
            raise ValueError(
                f"DATABASE_URL uses 'postgres://' which is not supported. "
                f"Please use 'postgresql+asyncpg://' format. "
                f"Example: postgresql+asyncpg://user:password@host:port/database"
            )
        elif v.startswith("postgresql://") and "+asyncpg" not in v:
            raise ValueError(
                f"DATABASE_URL must include '+asyncpg' driver. "
                f"Please use 'postgresql+asyncpg://' format. "
                f"Example: postgresql+asyncpg://user:password@host:port/database"
            )
        elif not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                f"DATABASE_URL must start with 'postgresql+asyncpg://'. "
                f"Current format: {v[:50]}... "
                f"Example: postgresql+asyncpg://user:password@host:port/database"
            )
        
        return v
    
    # Redis (for caching and state management)
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_TTL: int = 3600  # Default TTL in seconds
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File Storage - AWS S3 / MinIO
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "cee-documents"
    S3_ENDPOINT_URL: Optional[str] = None  # For S3-compatible services (e.g., MinIO)
    UPLOAD_DIR: str = "./uploads"  # Fallback for local storage
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    USE_S3: bool = True  # Set to False to use local storage
    
    # Typesense (Search)
    TYPESENSE_HOST: str = "localhost"
    TYPESENSE_PORT: int = 8108
    TYPESENSE_PROTOCOL: str = "http"
    TYPESENSE_API_KEY: str = "xyz"
    
    # AI Providers (defaults, can be overridden in database)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    class Config:
        # Prioritize environment variables over .env file
        # Environment variables take precedence by default in Pydantic Settings
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        # Ensure environment variables are checked first
        env_ignore_empty = True


settings = Settings()

