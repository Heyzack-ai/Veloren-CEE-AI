"""Search Service."""
from typing import Any, Optional
from pydantic import BaseModel

from .typesense_client import get_typesense_client, TYPESENSE_AVAILABLE


class SearchResult(BaseModel):
    """Search result model."""
    hits: list[dict[str, Any]]
    total: int
    page: int
    total_pages: int


class GlobalSearchResult(BaseModel):
    """Global search result model."""
    dossiers: SearchResult
    documents: SearchResult
    installers: SearchResult


class SearchService:
    """Service for Typesense search operations."""

    def __init__(self):
        if TYPESENSE_AVAILABLE:
            try:
                self.client = get_typesense_client()
            except Exception:
                self.client = None
        else:
            self.client = None

    async def search_dossiers(
        self,
        query: str,
        filters: Optional[dict[str, str]] = None,
        page: int = 1,
        per_page: int = 20
    ) -> SearchResult:
        """Search dossiers collection."""
        if not self.client:
            # Return empty result if Typesense is not available
            return SearchResult(hits=[], total=0, page=page, total_pages=0)
        
        filter_by = self._build_filter_string(filters) if filters else ""

        try:
            result = self.client.collections["dossiers"].documents.search({
                "q": query,
                "query_by": "reference,beneficiary_name,beneficiary_address,installer_name",
                "filter_by": filter_by,
                "page": page,
                "per_page": per_page,
                "highlight_full_fields": "beneficiary_name,reference"
            })

            return SearchResult(
                hits=[h["document"] for h in result.get("hits", [])],
                total=result["found"],
                page=result["page"],
                total_pages=(result["found"] + per_page - 1) // per_page
            )
        except Exception:
            # Return empty result if Typesense is not available
            return SearchResult(hits=[], total=0, page=page, total_pages=0)

    async def global_search(self, query: str) -> GlobalSearchResult:
        """Search across all collections."""
        dossiers = await self.search_dossiers(query, per_page=5)
        # TODO: Implement documents and installers search
        documents = SearchResult(hits=[], total=0, page=1, total_pages=0)
        installers = SearchResult(hits=[], total=0, page=1, total_pages=0)

        return GlobalSearchResult(
            dossiers=dossiers,
            documents=documents,
            installers=installers
        )

    def _build_filter_string(self, filters: dict[str, str]) -> str:
        """Build Typesense filter string from dict."""
        parts = [f"{k}:={v}" for k, v in filters.items()]
        return " && ".join(parts)

