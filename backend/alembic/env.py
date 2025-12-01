"""Alembic environment configuration."""
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import os

# Import Base without triggering engine creation
# We need to import models first to ensure they're registered with Base
from app.models import (
    User, Installer, Process, Dossier, Document, DocumentType,
    ExtractedField, FieldSchema, ValidationRule, ValidationResult,
    HumanFeedback, Invoice, ActivityLog, AIConfiguration, ModelPerformanceMetrics
)
# Import Base after models are loaded
from app.core.database import Base

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
# This is optional - only configure if logging section exists
if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name)
    except (KeyError, ValueError):
        # Logging config not found or invalid, use default logging
        import logging
        logging.basicConfig(level=logging.INFO)

# Override sqlalchemy.url with environment variable if set
# Try to load from .env file first
from pathlib import Path
from dotenv import load_dotenv

def normalize_database_url(url: str) -> str:
    """Convert postgres:// to postgresql+asyncpg:// format."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

database_url = os.getenv("DATABASE_URL")
if database_url:
    # Normalize the URL to use asyncpg
    database_url = normalize_database_url(database_url)
    config.set_main_option("sqlalchemy.url", database_url)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    import asyncio
    from sqlalchemy.exc import OperationalError
    
    configuration = config.get_section(config.config_ini_section)
    database_url = config.get_main_option("sqlalchemy.url")
    configuration["sqlalchemy.url"] = database_url
    
    # Print connection info for debugging
    print(f"Connecting to database: {database_url.split('@')[1] if '@' in database_url else '***'}")
    
    # Retry connection with exponential backoff
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            connectable = async_engine_from_config(
                configuration,
                prefix="sqlalchemy.",
                poolclass=pool.NullPool,
            )
            
            async with connectable.connect() as connection:
                await connection.run_sync(do_run_migrations)
            
            await connectable.dispose()
            print("✓ Migrations completed successfully")
            return
            
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Database connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                print(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print(f"ERROR: Failed to connect to database after {max_retries} attempts")
                print(f"Database URL: {database_url.split('@')[1] if '@' in database_url else '***'}")
                print(f"Error: {e}")
                print("\nTroubleshooting:")
                print("1. Verify database is running and accessible")
                print("2. Check DATABASE_URL is correct")
                print("3. Verify network connectivity between containers")
                print("4. Check database credentials and permissions")
                raise
        except Exception as e:
            print(f"ERROR: Migration failed with error: {e}")
            print(f"Database URL: {database_url.split('@')[1] if '@' in database_url else '***'}")
            raise


if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio
    asyncio.run(run_migrations_online())

