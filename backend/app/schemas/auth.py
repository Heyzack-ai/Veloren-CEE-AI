"""Authentication schemas."""
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_serializer
from app.models.user import UserRole


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""
    user_id: int | None = None


class UserLogin(BaseModel):
    """User login request schema."""
    username: str
    password: str


class UserCreate(BaseModel):
    """User creation schema."""
    email: EmailStr
    username: str
    password: str
    role: UserRole


class UserResponse(BaseModel):
    """User response schema."""
    id: int
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

