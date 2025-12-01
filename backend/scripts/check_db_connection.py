"""Check database connection and configuration before starting the application."""
import os
import sys
from pathlib import Path

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def normalize_database_url(url: str) -> str:
    """Convert postgres:// to postgresql+asyncpg:// format."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

def check_database_url():
    """Validate and normalize DATABASE_URL format."""
    database_url = os.getenv("DATABASE_URL", "")
    
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set")
        sys.exit(1)
    
    # Print full URL for debugging (user requested this)
    print(f"Original DATABASE_URL: {database_url}")
    
    # Normalize the URL
    normalized_url = normalize_database_url(database_url)
    
    if normalized_url != database_url:
        print(f"Normalized DATABASE_URL: {normalized_url}")
        # Update environment variable for this process and child processes (like alembic)
        os.environ["DATABASE_URL"] = normalized_url
        print("✓ Updated DATABASE_URL environment variable with normalized format")
    
    # Verify it's now in correct format
    if "postgresql+asyncpg://" not in normalized_url:
        print(f"ERROR: DATABASE_URL must be convertible to 'postgresql+asyncpg://' format")
        print(f"Current DATABASE_URL: {database_url}")
        sys.exit(1)
    
    print(f"✓ DATABASE_URL format is correct (normalized to asyncpg)")
    return True

def check_asyncpg():
    """Verify asyncpg is installed and importable."""
    try:
        import asyncpg
        print(f"✓ asyncpg is installed (version: {asyncpg.__version__})")
        return True
    except ImportError as e:
        print(f"ERROR: asyncpg is not installed or not accessible")
        print(f"Import error: {e}")
        sys.exit(1)

def check_sqlalchemy():
    """Verify SQLAlchemy is installed."""
    try:
        import sqlalchemy
        print(f"✓ SQLAlchemy is installed (version: {sqlalchemy.__version__})")
        print("  (asyncpg dialect will be loaded automatically when engine is created)")
        return True
    except ImportError as e:
        print(f"ERROR: SQLAlchemy is not installed")
        print(f"Import error: {e}")
        print("\nInstall with: pip install sqlalchemy")
        sys.exit(1)

if __name__ == "__main__":
    print("Checking database configuration...")
    check_asyncpg()
    check_database_url()
    check_sqlalchemy()
    print("\n✓ All database checks passed")
    print("Note: SQLAlchemy will load the asyncpg dialect automatically when creating the engine.")

