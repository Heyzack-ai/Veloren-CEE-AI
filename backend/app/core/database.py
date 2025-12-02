"""Database configuration and session management."""
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker, AsyncEngine
from sqlalchemy.orm import declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Import asyncpg to ensure it's available for SQLAlchemy
try:
    import asyncpg  # noqa: F401
except ImportError:
    raise ImportError(
        "asyncpg is required but not installed. Install it with: pip install asyncpg"
    )


def validate_database_url(url: str) -> str:
    """Validate and ensure DATABASE_URL has the correct format for asyncpg."""
    if not url:
        logger.error("DATABASE_URL is not set in environment variables")
        raise ValueError("DATABASE_URL is not set")
    
    logger.info(f"Validating DATABASE_URL format. URL starts with: {url[:30]}...")
    
    # Check if URL needs asyncpg driver
    if url.startswith("postgres://"):
        error_msg = (
            f"DATABASE_URL uses 'postgres://' which is not supported. "
            f"Please use 'postgresql+asyncpg://' format. "
            f"Current URL: {url}"
        )
        logger.error(error_msg)
        raise ValueError(error_msg)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        error_msg = (
            f"DATABASE_URL must include '+asyncpg' driver. "
            f"Please use 'postgresql+asyncpg://' format. "
            f"Current URL: {url}"
        )
        logger.error(error_msg)
        raise ValueError(error_msg)
    elif not url.startswith("postgresql+asyncpg://"):
        error_msg = (
            f"DATABASE_URL must start with 'postgresql+asyncpg://'. "
            f"Current URL format: {url}"
        )
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    logger.info("DATABASE_URL format is valid")
    return url

# Lazy engine creation - only create when needed
_engine: Optional[AsyncEngine] = None
_AsyncSessionLocal: Optional[async_sessionmaker] = None


def get_engine() -> AsyncEngine:
    """Get or create the async engine."""
    global _engine
    if _engine is None:
        # Get DATABASE_URL from settings (which reads from environment)
        db_url = settings.DATABASE_URL
        
        # Validate DATABASE_URL format BEFORE passing to SQLAlchemy
        # This prevents SQLAlchemy from trying to parse invalid URLs
        db_url = validate_database_url(db_url)
        
        logger.info(f"Creating database engine with URL: {db_url[:50]}...")
        
        try:
            _engine = create_async_engine(
                db_url,
                echo=settings.DEBUG,
                future=True,
            )
        except Exception as e:
            logger.error(f"Failed to create database engine: {e}")
            logger.error(f"DATABASE_URL being used: {db_url[:100]}...")
            raise ValueError(
                f"Failed to create database engine. "
                f"Please ensure DATABASE_URL is in format: postgresql+asyncpg://user:password@host:port/database. "
                f"Error: {e}"
            ) from e
    return _engine


def get_session_maker() -> async_sessionmaker:
    """Get or create the async session factory."""
    global _AsyncSessionLocal
    if _AsyncSessionLocal is None:
        _AsyncSessionLocal = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _AsyncSessionLocal


# For backward compatibility - these will be created on first access
# Don't create engine on import to avoid import-time errors
# Use get_engine() and get_session_maker() functions instead

# Base for SQLAlchemy models (compatible with Drizzle)
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session."""
    session_maker = get_session_maker()
    async with session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

