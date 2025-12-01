#!/bin/bash

# Start script for PDF Checker Backend

echo "Starting PDF Checker Backend..."

# Start Docker services
echo "Starting Docker services (PostgreSQL)..."
docker compose up -d postgres 2>/dev/null || echo "Note: Using existing PostgreSQL or Docker service already running"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "Please update .env with your AWS S3 credentials and database connection."
    echo "See .env.example for required variables."
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Initialize database with admin user
echo "Initializing database..."
python scripts/init_db.py

# Start server
echo "Starting FastAPI server..."
echo "API will be available at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

