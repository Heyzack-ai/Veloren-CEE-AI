#!/bin/bash
set -e

cd /app

echo "Starting CEE Validation System backend..."

# Check database connection
echo "Checking database connection..."
python /app/scripts/check_db_connection.py || {
    echo "ERROR: Database connection check failed"
    exit 1
}

# Run database migrations (idempotent - safe to run even if already applied)
echo "Running database migrations..."
python -m alembic upgrade head || {
    echo "WARNING: Database migration had issues, but continuing..."
    # Don't exit on migration failure if tables might already exist
    # This handles the case where migrations are partially applied
}

# Start the server
echo "Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

