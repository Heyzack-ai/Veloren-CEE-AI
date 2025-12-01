"""AI configuration endpoints."""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.ai_configuration import AIConfiguration

router = APIRouter(prefix="/api/ai", tags=["ai_config"])


@router.get("/config")
async def get_ai_config(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get AI configuration."""
    result = await db.execute(
        select(AIConfiguration).where(AIConfiguration.is_active == True)
        .order_by(AIConfiguration.priority.desc())
    )
    configs = result.scalars().all()
    
    return {"configurations": configs}


@router.patch("/config")
async def update_ai_config(
    config_data: dict,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update AI configuration."""
    config_key = config_data.get("config_key")
    if not config_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="config_key is required"
        )
    
    result = await db.execute(
        select(AIConfiguration).where(AIConfiguration.config_key == config_key)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    update_data = {k: v for k, v in config_data.items() if k != "config_key"}
    for field, value in update_data.items():
        if hasattr(config, field):
            setattr(config, field, value)
    
    await db.commit()
    await db.refresh(config)
    
    return config


@router.get("/providers")
async def list_providers(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List available AI providers."""
    return {
        "providers": [
            {"name": "openai", "models": ["gpt-4o", "gpt-4-vision"]},
            {"name": "anthropic", "models": ["claude-3-5-sonnet", "claude-3-opus"]},
            {"name": "mistral", "models": ["mistral-large"]},
            {"name": "local", "models": ["ollama", "vllm"]}
        ]
    }


@router.post("/providers/{provider_id}/test")
async def test_provider(
    provider_id: str,
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Test provider connection."""
    # TODO: Implement provider health check
    return {"status": "ok", "message": "Provider test not yet implemented"}


@router.get("/models")
async def list_models(
    current_user: Annotated[User, Depends(require_role([UserRole.ADMINISTRATOR]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List available models."""
    result = await db.execute(
        select(AIConfiguration).where(AIConfiguration.is_active == True)
    )
    configs = result.scalars().all()
    
    models = {}
    for config in configs:
        provider = config.provider
        if provider not in models:
            models[provider] = []
        models[provider].append({
            "name": config.model_name,
            "version": config.model_version,
            "task": config.config_key
        })
    
    return {"models": models}

