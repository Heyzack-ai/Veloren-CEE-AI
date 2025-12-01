"""API routers."""
from . import (
    auth, dossiers, documents, validation, processes, installers, users,
    billing, analytics, activity, search, rules, schemas, feedback, ai_config
)

__all__ = [
    "auth", "dossiers", "documents", "validation", "processes", "installers",
    "users", "billing", "analytics", "activity", "search", "rules", "schemas",
    "feedback", "ai_config"
]
