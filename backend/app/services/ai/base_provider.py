"""AI Provider base class."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional
from pydantic import BaseModel


class BoundingBox(BaseModel):
    """Bounding box model."""
    x: float
    y: float
    width: float
    height: float


class ClassificationResult(BaseModel):
    """Classification result model."""
    document_type: str
    confidence: float
    alternatives: list[dict[str, Any]]  # [{"type": str, "confidence": float}]


class ExtractedField(BaseModel):
    """Extracted field model."""
    field_name: str
    value: Any
    confidence: float
    bounding_box: Optional[BoundingBox] = None
    page_number: Optional[int] = None


class ExtractionResult(BaseModel):
    """Extraction result model."""
    fields: list[ExtractedField]
    raw_text: Optional[str] = None
    processing_time: float


class SignatureDetection(BaseModel):
    """Signature detection model."""
    detected: bool
    confidence: float
    location: Optional[BoundingBox] = None
    page_number: Optional[int] = None


@dataclass
class AIProviderConfig:
    """AI Provider configuration."""
    api_key: Optional[str] = None
    api_endpoint: Optional[str] = None
    model: str = ""
    parameters: Optional[dict[str, Any]] = None


class AIProvider(ABC):
    """Abstract base class for all AI providers."""

    def __init__(self, config: AIProviderConfig):
        self.config = config

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name (e.g., 'openai', 'anthropic')."""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Provider version."""
        pass

    @abstractmethod
    async def classify_document(
        self,
        document: bytes,
        mime_type: str,
        possible_types: Optional[list[str]] = None
    ) -> ClassificationResult:
        """Classify document type."""
        pass

    @abstractmethod
    async def extract_fields(
        self,
        document: bytes,
        mime_type: str,
        schema: list[dict],
        language: str = "fr"
    ) -> ExtractionResult:
        """Extract fields from document."""
        pass

    @abstractmethod
    async def extract_text(
        self,
        document: bytes,
        mime_type: str,
        language: str = "fr",
        preserve_layout: bool = False
    ) -> str:
        """Extract text via OCR."""
        pass

    @abstractmethod
    async def detect_signatures(
        self,
        image: bytes,
        min_confidence: float = 0.7
    ) -> list[SignatureDetection]:
        """Detect signatures in image."""
        pass

    @abstractmethod
    async def analyze_image(
        self,
        image: bytes,
        prompt: str,
        max_tokens: int = 1000
    ) -> str:
        """Analyze image with vision model."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check provider availability."""
        pass

