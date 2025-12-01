#!/bin/bash
set -e

cd /app

echo "=========================================="
echo "Starting CEE Validation System backend..."
echo "=========================================="
echo "Working directory: $(pwd)"
echo "Python path: $(which python)"
echo "Alembic path: $(which alembic || echo 'alembic not in PATH, using python -m alembic')"
echo "=========================================="

# Check database connection
echo "[1/3] Checking database connection..."
python /app/scripts/check_db_connection.py
echo "✓ Database connection successful"

# Run database migrations (idempotent - safe to run even if already applied)
echo "[2/3] Running database migrations..."
echo "Current alembic version:"
python -m alembic current || echo "No current version (fresh database)"
echo "Upgrading to head..."
python -m alembic upgrade head
echo "✓ Database migrations completed"

# Verify users table exists
echo "[2.5/3] Verifying database schema..."
python -c "
import asyncio
import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path('/app')))
from app.core.database import get_engine
from sqlalchemy import text

async def verify_tables():
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(text(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')\"))
            exists = result.scalar()
            if exists:
                print('✓ Users table exists')
            else:
                print('✗ ERROR: Users table does not exist after migrations!')
                sys.exit(1)
    except Exception as e:
        print(f'✗ ERROR checking tables: {e}')
        sys.exit(1)

asyncio.run(verify_tables())
"

# Start the server
echo "[3/3] Starting uvicorn server..."
echo "=========================================="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

