"""Typesense client configuration."""
import typesense
from app.core.config import settings


def get_typesense_client() -> typesense.Client:
    """Create Typesense client instance."""
    return typesense.Client({
        "nodes": [{
            "host": settings.TYPESENSE_HOST,
            "port": settings.TYPESENSE_PORT,
            "protocol": settings.TYPESENSE_PROTOCOL
        }],
        "api_key": settings.TYPESENSE_API_KEY,
        "connection_timeout_seconds": 2
    })


# Collection schemas
COLLECTIONS = {
    "dossiers": {
        "name": "dossiers",
        "fields": [
            {"name": "id", "type": "string"},
            {"name": "reference", "type": "string"},
            {"name": "beneficiary_name", "type": "string"},
            {"name": "beneficiary_address", "type": "string"},
            {"name": "beneficiary_city", "type": "string"},
            {"name": "installer_name", "type": "string"},
            {"name": "process_code", "type": "string", "facet": True},
            {"name": "process_name", "type": "string"},
            {"name": "status", "type": "string", "facet": True},
            {"name": "priority", "type": "string", "facet": True},
            {"name": "confidence_score", "type": "float"},
            {"name": "submitted_at", "type": "int64"},
            {"name": "validated_at", "type": "int64", "optional": True}
        ],
        "default_sorting_field": "submitted_at"
    },
    "documents": {
        "name": "documents",
        "fields": [
            {"name": "id", "type": "string"},
            {"name": "dossier_id", "type": "string"},
            {"name": "dossier_reference", "type": "string"},
            {"name": "document_type", "type": "string", "facet": True},
            {"name": "filename", "type": "string"},
            {"name": "ocr_text", "type": "string"},
            {"name": "processing_status", "type": "string", "facet": True},
            {"name": "uploaded_at", "type": "int64"}
        ],
        "default_sorting_field": "uploaded_at"
    },
    "installers": {
        "name": "installers",
        "fields": [
            {"name": "id", "type": "string"},
            {"name": "company_name", "type": "string"},
            {"name": "siret", "type": "string"},
            {"name": "city", "type": "string", "facet": True},
            {"name": "contact_name", "type": "string"},
            {"name": "contact_email", "type": "string"},
            {"name": "rge_status", "type": "string", "facet": True},
            {"name": "qualifications", "type": "string[]", "facet": True},
            {"name": "active", "type": "bool", "facet": True}
        ]
    }
}

