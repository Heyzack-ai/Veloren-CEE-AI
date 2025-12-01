"""Initialize database with admin user."""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path so we can import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Initialize database with default admin user."""
    async with AsyncSessionLocal() as session:
        # Check if admin user exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == "admin@example.com")
        )
        admin_user = result.scalar_one_or_none()
        
        if admin_user:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            name="Administrator",
            role=UserRole.ADMINISTRATOR,
            active=True
        )
        session.add(admin_user)
        await session.commit()
        print("Admin user created successfully!")
        print("Email: admin@example.com")
        print("Password: admin123")
        print("Please change the password after first login!")


if __name__ == "__main__":
    asyncio.run(init_db())

