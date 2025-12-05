"""Wait for database to be ready before running migrations."""
import asyncio
import sys
import os
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

async def check_db_connection(max_retries=30, retry_delay=2):
    """Wait for database to be ready."""
    import asyncpg
    from urllib.parse import urlparse
    
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)
    
    # Normalize URL
    database_url = normalize_database_url(database_url)
    
    # Parse URL to extract connection details
    parsed = urlparse(database_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    user = parsed.username or "postgres"
    password = parsed.password or ""
    database = parsed.path.lstrip("/") or "postgres"
    
    print(f"Waiting for database at {host}:{port}/{database}...")
    
    for attempt in range(max_retries):
        try:
            conn = await asyncpg.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                timeout=5
            )
            await conn.close()
            print(f"✓ Database is ready!")
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Database not ready (attempt {attempt + 1}/{max_retries}): {str(e)[:100]}")
                print(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                print(f"ERROR: Database not ready after {max_retries} attempts")
                print(f"Host: {host}:{port}")
                print(f"Database: {database}")
                print(f"Error: {e}")
                sys.exit(1)
    
    return False

if __name__ == "__main__":
    asyncio.run(check_db_connection())

