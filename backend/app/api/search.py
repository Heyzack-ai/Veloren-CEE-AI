"""Search endpoints."""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.search import SearchService

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def global_search(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1)
):
    """Global search across all collections."""
    service = SearchService()
    result = await service.global_search(q)
    return result


@router.get("/dossiers")
async def search_dossiers(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1),
    status: Optional[str] = Query(None),
    process_code: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Search dossiers."""
    service = SearchService()
    filters = {}
    if status:
        filters["status"] = status
    if process_code:
        filters["process_code"] = process_code
    
    result = await service.search_dossiers(q, filters, page, per_page)
    return result


@router.get("/documents")
async def search_documents(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1),
    dossier_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Search documents."""
    # TODO: Implement document search
    return {"hits": [], "total": 0, "page": page, "total_pages": 0}


@router.get("/installers")
async def search_installers(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1),
    city: Optional[str] = Query(None)
):
    """Search installers."""
    # TODO: Implement installer search
    return {"hits": [], "total": 0, "page": 1, "total_pages": 0}

