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
    """Verify SQLAlchemy can load the postgresql+asyncpg dialect."""
    try:
        from sqlalchemy.engine import URL
        
        # Test parsing the URL to ensure dialect can be loaded
        test_url = "postgresql+asyncpg://user:pass@localhost:5432/test"
        url_obj = URL.create(test_url)
        
        # Try to get the dialect
        from sqlalchemy.dialects import registry
        dialect = registry.load("postgresql+asyncpg")
        print("✓ SQLAlchemy can load postgresql+asyncpg dialect")
        return True
    except Exception as e:
        print(f"ERROR: SQLAlchemy cannot load postgresql+asyncpg dialect")
        print(f"Error: {e}")
        print("\nTroubleshooting:")
        print("1. Ensure asyncpg is installed: pip install asyncpg")
        print("2. Check DATABASE_URL format: postgresql+asyncpg://...")
        print("3. Verify SQLAlchemy version: pip show sqlalchemy")
        sys.exit(1)

if __name__ == "__main__":
    print("Checking database configuration...")
    check_asyncpg()
    check_database_url()
    check_sqlalchemy()
    print("✓ All database checks passed")

