"""Check database connection and configuration before starting the application."""
import os
import sys
from pathlib import Path

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def check_database_url():
    """Validate DATABASE_URL format."""
    database_url = os.getenv("DATABASE_URL", "")
    
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set")
        sys.exit(1)
    
    # Check if it's using asyncpg
    if "postgresql+asyncpg://" not in database_url and "postgresql://" in database_url:
        print("WARNING: DATABASE_URL uses 'postgresql://' but should use 'postgresql+asyncpg://' for async support")
        print(f"Current DATABASE_URL: {database_url[:50]}...")
        print("Please update your DATABASE_URL to use 'postgresql+asyncpg://'")
        sys.exit(1)
    
    if "postgresql+asyncpg://" not in database_url:
        print(f"ERROR: DATABASE_URL must use 'postgresql+asyncpg://' format")
        print(f"Current DATABASE_URL: {database_url[:50]}...")
        sys.exit(1)
    
    print(f"✓ DATABASE_URL format is correct")
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

