# Multi-stage build for optimized production image
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (including build tools for asyncpg)
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq5 \
    libpq-dev \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy application code first
COPY --chown=root:root . .

# Install Python dependencies (system-wide, accessible to all users)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -c "import asyncpg; print('✓ asyncpg installed:', asyncpg.__version__)" && \
    python -c "import sqlalchemy; print('✓ SQLAlchemy version:', sqlalchemy.__version__)"

# Make entrypoint script executable
RUN chmod +x /app/scripts/entrypoint.sh

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Set Python environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start server with entrypoint script (runs migrations automatically)
# Using bash explicitly to ensure script runs correctly
CMD ["/bin/bash", "/app/scripts/entrypoint.sh"]

