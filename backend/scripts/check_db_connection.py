"""Check database connection and configuration before starting the application."""
import os
import sys
from pathlib import Path

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def check_database_url():
    """Validate DATABASE_URL is set."""
    database_url = os.getenv("DATABASE_URL", "")
    
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set")
        sys.exit(1)
    
    print(f"✓ DATABASE_URL is set")
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

