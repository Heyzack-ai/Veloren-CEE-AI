"""Authentication schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    """Token data schema."""
    user_id: Optional[UUID] = None


class UserLogin(BaseModel):
    """User login request schema."""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class UserCreate(BaseModel):
    """User creation schema."""
    email: EmailStr
    password: str
    name: str
    role: UserRole


class UserUpdate(BaseModel):
    """User update schema."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    active: Optional[bool] = None


class UserResponse(BaseModel):
    """User response schema."""
    id: UUID
    email: str
    name: str
    role: UserRole
    active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""
    current_password: str
    new_password: str

