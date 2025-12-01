"""Database configuration and session management."""
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker, AsyncEngine
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Import asyncpg to ensure it's available for SQLAlchemy
try:
    import asyncpg  # noqa: F401
except ImportError:
    raise ImportError(
        "asyncpg is required but not installed. Install it with: pip install asyncpg"
    )

# Lazy engine creation - only create when needed
_engine: Optional[AsyncEngine] = None
_AsyncSessionLocal: Optional[async_sessionmaker] = None


def get_engine() -> AsyncEngine:
    """Get or create the async engine."""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            future=True,
        )
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


# For backward compatibility - create lazy properties
# Engine will be created on first access, not on import
@property
def engine():
    """Lazy engine property."""
    return get_engine()

@property  
def AsyncSessionLocal():
    """Lazy session factory property."""
    return get_session_maker()

# Create actual engine and session factory for immediate use
# But wrap in try/except to avoid import-time errors
try:
    _engine_instance = get_engine()
    _session_factory = get_session_maker()
except Exception:
    # If engine creation fails on import, that's OK - will be created on first use
    _engine_instance = None
    _session_factory = None

# Export for backward compatibility
engine = _engine_instance if _engine_instance else get_engine()
AsyncSessionLocal = _session_factory if _session_factory else get_session_maker()

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

