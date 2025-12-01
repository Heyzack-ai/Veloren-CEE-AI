# CEE Document Validation System
## Product Specification & Technical Architecture v2

**Version:** 2.0  
**Date:** November 2025  
**Prepared for:** Valoren.org  
**Target Accuracy:** 98.9%

---

## Executive Summary

This document outlines a comprehensive AI-powered system for automating CEE (Certificats d'Économies d'Énergie) document validation. The system is designed to be **fully configurable**, allowing users to:

- Create new **Processes** (CEE operations or any custom workflow)
- Define **Documents** required for each process
- Configure **Field Schemas** for each document type
- Set up **Validation Rules** for each entity

### Key Design Principles

1. **Process-Agnostic Architecture**: Users can create any process, not just CEE operations
2. **Dynamic Schema Configuration**: Document schemas are user-defined, not hardcoded
3. **Flexible Rule Engine**: Rules can be created per process, per document, or globally
4. **Human-in-the-Loop**: AI suggests, humans validate, feedback improves the system
5. **Simple Infrastructure**: Docker-based deployment, no over-engineering

---

## Part 1: System Overview

### 1.1 Core Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CEE VALIDATION WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌───────────────┐  │
│  │ Document │───▶│ Classification│───▶│  Extraction │───▶│   Rule-Based  │  │
│  │  Upload  │    │  (Gemini 2.5)│    │ (Gemini 2.5)│    │  Validation   │  │
│  └──────────┘    └──────────────┘    └─────────────┘    └───────────────┘  │
│                                                                     │       │
│                                                                     ▼       │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌───────────────┐  │
│  │ Billing  │◀───│   Approved   │◀───│   Human     │◀───│  Validation   │  │
│  │  Action  │    │   Dossier    │    │  Review UI  │    │   Results     │  │
│  └──────────┘    └──────────────┘    └─────────────┘    └───────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Configurable Entity Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONFIGURATION HIERARCHY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROCESS (e.g., BAR-TH-171, BAT-TH-116, Custom Workflow)                   │
│  │                                                                          │
│  ├── DOCUMENT TYPES (required for this process)                            │
│  │   ├── Devis (Quote)                                                     │
│  │   │   ├── FIELD SCHEMA (what to extract)                               │
│  │   │   │   ├── numero_devis: String, required                           │
│  │   │   │   ├── date_devis: Date, required                               │
│  │   │   │   ├── prime_cee: Currency, required                            │
│  │   │   │   └── ... (user-defined fields)                                │
│  │   │   └── RULES (validation rules for this document)                   │
│  │   │       ├── date_devis <= today()                                    │
│  │   │       └── prime_cee > 0                                            │
│  │   │                                                                     │
│  │   ├── Facture (Invoice)                                                │
│  │   │   ├── FIELD SCHEMA                                                 │
│  │   │   └── RULES                                                        │
│  │   │                                                                     │
│  │   └── Attestation sur l'Honneur                                        │
│  │       ├── FIELD SCHEMA                                                 │
│  │       └── RULES                                                        │
│  │                                                                          │
│  └── CROSS-DOCUMENT RULES (rules spanning multiple documents)              │
│      ├── devis.prime_cee == facture.prime_cee                             │
│      ├── devis.date_signature < facture.date_facture                      │
│      └── similarity(devis.beneficiaire, ah.beneficiaire) >= 0.95          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Default Document Types (Pre-configured)

| Document Type | French Name | Description |
|--------------|-------------|-------------|
| DEVIS | Devis | Initial quote with CEE prime deduction |
| FACTURE | Facture | Final invoice after work completion |
| AH | Attestation sur l'Honneur | Official CEE form with sections A, B, C, R1 |
| CDC | Cadre de Contribution | Prime agreement document |
| AVIS_IMPOT | Avis d'Impôt | Income verification for precarity status |
| PHOTO | Photos Avant/Après | Before/after installation photos |
| NOTE_DIMENSIONNEMENT | Note de Dimensionnement | Technical sizing calculations |
| CONTRAT | Contrat de Partenariat | Installer-Mandataire agreement |
| CUSTOM | Custom | User-defined document type |

---

## Part 2: System Architecture

### 2.1 High-Level Architecture (Docker-Based)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOCKER COMPOSE STACK                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         NGINX REVERSE PROXY                         │    │
│  │                    (SSL termination, routing)                       │    │
│  │                         Port 80/443                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                      │                                      │
│              ┌───────────────────────┼───────────────────────┐             │
│              │                       │                       │             │
│              ▼                       ▼                       ▼             │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────────┐ │
│  │   MOTIA BACKEND    │ │  NEXT.JS FRONTEND  │ │   MOTIA WORKBENCH      │ │
│  │   (Python Steps)   │ │   (shadcn/ui)      │ │   (Dev/Debug UI)       │ │
│  │   Port 3001        │ │   Port 3000        │ │   Port 3002            │ │
│  └────────────────────┘ └────────────────────┘ └────────────────────────┘ │
│              │                       │                       │             │
│              └───────────────────────┼───────────────────────┘             │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                           REDIS                                     │    │
│  │              (Cache, Queue, Pub/Sub for real-time)                 │    │
│  │                         Port 6379                                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                      │                                      │
│              ┌───────────────────────┼───────────────────────┐             │
│              │                       │                       │             │
│              ▼                       ▼                       ▼             │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────────┐ │
│  │    POSTGRESQL      │ │   MINIO (S3)       │ │   TYPESENSE         │ │
│  │  (Main Database)   │ │ (Document Storage) │ │  (Fast Search)         │ │
│  │    Port 5432       │ │   Port 9000        │ │   Port 7700            │ │
│  └────────────────────┘ └────────────────────┘ └────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    SIGNOZ / SENTRY                                  │    │
│  │              (Monitoring, Tracing, Error Tracking)                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend Framework** | Motia (Python Steps) | Event-driven workflow orchestration |
| **Frontend** | Next.js 14 + shadcn/ui | Modern React UI with beautiful components |
| **Database** | PostgreSQL 16 | Main data store with full-text search |
| **Cache/Queue** | Redis 7 | Caching, event queue, real-time pub/sub |
| **Object Storage** | MinIO | S3-compatible document storage |
| **Search** | Typesense | Fast, typo-tolerant search |
| **VLM/OCR** | Gemini 2.5 Flash/Pro | Document understanding, field extraction |
| **Handwriting** | Gemini 2.5 (image input) | Signature and handwriting detection |
| **Monitoring** | Signoz OR Sentry | Observability, error tracking, APM |
| **Reverse Proxy** | Nginx | SSL, routing, load balancing |
| **Containerization** | Docker + Docker Compose | Simple deployment |

### 2.3 Motia Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOTIA STEP ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  API STEPS (HTTP Endpoints)                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ upload_document.step.py      POST /api/documents/upload            │   │
│  │ get_dossier.step.py          GET  /api/dossiers/{id}               │   │
│  │ create_process.step.py       POST /api/processes                   │   │
│  │ create_rule.step.py          POST /api/rules                       │   │
│  │ validate_dossier.step.py     POST /api/dossiers/{id}/validate      │   │
│  │ approve_dossier.step.py      POST /api/dossiers/{id}/approve       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      │ emits events                         │
│                                      ▼                                      │
│  EVENT STEPS (Background Processing)                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ classify_document.step.py    subscribes: document.uploaded         │   │
│  │ extract_fields.step.py       subscribes: document.classified       │   │
│  │ detect_signatures.step.py    subscribes: document.fields_extracted │   │
│  │ run_validation.step.py       subscribes: dossier.ready_for_validation│  │
│  │ generate_billing.step.py     subscribes: dossier.approved          │   │
│  │ send_notification.step.py    subscribes: dossier.status_changed    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      │ uses                                 │
│                                      ▼                                      │
│  SHARED SERVICES                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ services/gemini_service.py       Gemini 2.5 API wrapper            │   │
│  │ services/rule_engine.py          Rule evaluation engine            │   │
│  │ services/storage_service.py      MinIO operations                  │   │
│  │ services/search_service.py       Typesense operations            │   │
│  │ services/notification_service.py Email/SMS notifications          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: AI Pipeline with Gemini 2.5

### 3.1 Document Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GEMINI 2.5 DOCUMENT PROCESSING PIPELINE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: DOCUMENT INGESTION                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Accept PDF, JPG, PNG, TIFF                                        │   │
│  │ • Convert PDF pages to images (pdf2image)                           │   │
│  │ • Store original in MinIO                                           │   │
│  │ • Create document record in PostgreSQL                              │   │
│  │ • Emit: document.uploaded                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 2: DOCUMENT CLASSIFICATION (Gemini 2.5)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Send page images to Gemini 2.5 Flash                              │   │
│  │ • Prompt: "Classify this document. Options: {process.document_types}│   │
│  │ • Return: document_type, confidence_score                           │   │
│  │ • If confidence < 0.85: flag for human review                       │   │
│  │ • Emit: document.classified                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 3: FIELD EXTRACTION (Gemini 2.5)                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Load field schema for document type                               │   │
│  │ • Send images + schema to Gemini 2.5 Pro                           │   │
│  │ • Prompt: "Extract fields according to schema: {schema_json}"       │   │
│  │ • Return: extracted_fields with confidence per field               │   │
│  │ • Emit: document.fields_extracted                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 4: SIGNATURE & HANDWRITING DETECTION (Gemini 2.5)                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Send relevant page regions to Gemini 2.5                          │   │
│  │ • Prompt: "Detect signatures, 'Bon pour accord', dates handwritten" │   │
│  │ • Return: signature_present, handwritten_text, bounding_boxes      │   │
│  │ • Store signature images for cross-document comparison             │   │
│  │ • Emit: document.signatures_detected                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 5: RULE VALIDATION                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Load rules for this document type                                 │   │
│  │ • Load cross-document rules for this process                       │   │
│  │ • Evaluate each rule against extracted data                        │   │
│  │ • Generate validation report (passed/warnings/errors)               │   │
│  │ • Emit: dossier.validation_complete                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 6: HUMAN REVIEW (if needed)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Display in validation UI                                          │   │
│  │ • Human reviews, corrects, approves/rejects                        │   │
│  │ • Corrections saved as training feedback                           │   │
│  │ • Emit: dossier.approved OR dossier.rejected                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Gemini 2.5 Integration

```python
# services/gemini_service.py

import google.generativeai as genai
from PIL import Image
import json
from typing import Dict, List, Any, Optional
import base64
import io

class GeminiService:
    """
    Unified Gemini 2.5 service for all document AI tasks.
    Uses Gemini 2.5 Flash for classification, Pro for extraction.
    """
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.flash_model = genai.GenerativeModel('gemini-2.5-flash')
        self.pro_model = genai.GenerativeModel('gemini-2.5-pro')
    
    async def classify_document(
        self,
        images: List[Image.Image],
        document_types: List[Dict]
    ) -> Dict[str, Any]:
        """
        Classify a document based on its images.
        
        Args:
            images: List of PIL Images (one per page)
            document_types: Available document types with descriptions
        
        Returns:
            {document_type, confidence, reasoning}
        """
        types_description = "\n".join([
            f"- {dt['code']}: {dt['name']} - {dt['description']}"
            for dt in document_types
        ])
        
        prompt = f"""Analyze this document and classify it into one of the following types:

{types_description}

Respond in JSON format:
{{
    "document_type": "TYPE_CODE",
    "confidence": 0.0 to 1.0,
    "reasoning": "Brief explanation",
    "page_types": ["type for each page if multi-page"]
}}

Only respond with valid JSON, no other text."""

        response = await self.flash_model.generate_content_async(
            [prompt] + images,
            generation_config={"response_mime_type": "application/json"}
        )
        
        return json.loads(response.text)
    
    async def extract_fields(
        self,
        images: List[Image.Image],
        schema: Dict[str, Any],
        document_type: str
    ) -> Dict[str, Any]:
        """
        Extract fields from document based on schema.
        
        Args:
            images: Document page images
            schema: Field schema defining what to extract
            document_type: Type of document for context
        
        Returns:
            {fields: {field_name: {value, confidence, location}}}
        """
        fields_description = "\n".join([
            f"- {f['name']} ({f['data_type']}): {f.get('description', '')} "
            f"[Required: {f.get('required', False)}]"
            for f in schema['fields']
        ])
        
        prompt = f"""Extract the following fields from this {document_type} document:

FIELDS TO EXTRACT:
{fields_description}

EXTRACTION RULES:
- For dates: use DD/MM/YYYY format
- For currency: extract numeric value only (e.g., 4000.00)
- For addresses: include full address with postal code and city
- For signatures: indicate if present (true/false) and describe location
- For handwritten text: transcribe exactly as written

Respond in JSON format:
{{
    "fields": {{
        "field_name": {{
            "value": "extracted value",
            "confidence": 0.0 to 1.0,
            "location": "page X, section Y" or null,
            "notes": "any relevant notes"
        }}
    }},
    "extraction_quality": "high/medium/low",
    "issues": ["list of any issues encountered"]
}}

Only respond with valid JSON."""

        response = await self.pro_model.generate_content_async(
            [prompt] + images,
            generation_config={"response_mime_type": "application/json"}
        )
        
        return json.loads(response.text)
    
    async def detect_signatures_and_handwriting(
        self,
        images: List[Image.Image],
        detection_zones: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Detect signatures and handwritten text in document images.
        
        Args:
            images: Document page images
            detection_zones: Optional specific zones to check
        
        Returns:
            {signatures: [], handwritten_text: [], checkboxes: []}
        """
        prompt = """Analyze this document for signatures and handwritten content.

DETECT:
1. Signatures: Location, quality (clear/partial/unclear)
2. Handwritten text: "Bon pour accord", dates, names, amounts
3. Checked boxes: Any checkbox fields that are marked
4. Stamps: Official stamps or seals

For each detection, provide:
- Type (signature/handwriting/checkbox/stamp)
- Page number
- Location description
- Content (for text)
- Confidence score

Respond in JSON format:
{
    "signatures": [
        {
            "page": 1,
            "location": "bottom right",
            "quality": "clear",
            "confidence": 0.95
        }
    ],
    "handwritten_text": [
        {
            "page": 1,
            "location": "below signature line",
            "content": "Bon pour accord",
            "type": "approval_mention",
            "confidence": 0.92
        }
    ],
    "checkboxes": [
        {
            "page": 2,
            "location": "section A, item 3",
            "checked": true,
            "confidence": 0.98
        }
    ],
    "stamps": []
}

Only respond with valid JSON."""

        response = await self.pro_model.generate_content_async(
            [prompt] + images,
            generation_config={"response_mime_type": "application/json"}
        )
        
        return json.loads(response.text)
    
    async def compare_signatures(
        self,
        signature_images: List[Image.Image],
        reference_labels: List[str]
    ) -> Dict[str, Any]:
        """
        Compare multiple signatures for consistency.
        
        Args:
            signature_images: List of cropped signature images
            reference_labels: Labels for each signature (e.g., "devis", "ah", "cdc")
        
        Returns:
            {consistent: bool, similarity_scores: {}, analysis: str}
        """
        labels_text = ", ".join(reference_labels)
        
        prompt = f"""Compare these {len(signature_images)} signatures from different documents.
The signatures are from: {labels_text}

Analyze:
1. Are these likely from the same person?
2. Similarity score between each pair (0.0 to 1.0)
3. Any suspicious differences?

Respond in JSON format:
{{
    "consistent": true/false,
    "likely_same_person": true/false,
    "similarity_matrix": {{
        "doc1_doc2": 0.95,
        "doc1_doc3": 0.93,
        ...
    }},
    "analysis": "Brief analysis",
    "concerns": ["list any concerns"]
}}

Only respond with valid JSON."""

        response = await self.pro_model.generate_content_async(
            [prompt] + signature_images,
            generation_config={"response_mime_type": "application/json"}
        )
        
        return json.loads(response.text)
```

---

## Part 4: Configuration System

### 4.1 Process Configuration

A **Process** defines a workflow type (e.g., a CEE operation, a custom validation workflow).

```json
{
  "process": {
    "id": "uuid",
    "code": "BAR-TH-171",
    "name": "Pompe à chaleur air/eau",
    "description": "Installation de pompe à chaleur de type air/eau",
    "category": "CEE_RESIDENTIAL",
    "version": "A46.3",
    "is_active": true,
    "valid_from": "2024-01-01",
    "valid_until": null,
    
    "required_documents": [
      {
        "document_type_id": "devis",
        "required": true,
        "order": 1
      },
      {
        "document_type_id": "facture",
        "required": true,
        "order": 2
      },
      {
        "document_type_id": "ah",
        "required": true,
        "order": 3
      },
      {
        "document_type_id": "cdc",
        "required": true,
        "order": 4
      },
      {
        "document_type_id": "avis_impot",
        "required": false,
        "condition": "beneficiary.precarite != 'CLASSIQUE'",
        "order": 5
      },
      {
        "document_type_id": "photo",
        "required": true,
        "min_count": 2,
        "order": 6
      }
    ],
    
    "cross_document_rules": [
      "rule_prime_consistency",
      "rule_date_logic",
      "rule_beneficiary_match",
      "rule_address_match",
      "rule_signature_consistency"
    ],
    
    "metadata": {
      "sector": "residential",
      "is_coup_de_pouce": true,
      "kwh_cumac_formula": "surface * zone_factor * energy_factor"
    }
  }
}
```

### 4.2 Document Type Configuration

A **Document Type** defines a type of document with its field schema.

```json
{
  "document_type": {
    "id": "devis",
    "code": "DEVIS",
    "name": "Devis",
    "description": "Quote document with work details and CEE prime",
    "category": "commercial",
    "is_system": true,
    "is_active": true,
    
    "classification_hints": [
      "Devis", "Quote", "Proposition commerciale",
      "N° de devis", "Référence devis"
    ],
    
    "expected_pages": {
      "min": 1,
      "max": 10,
      "typical": 2
    },
    
    "field_schema": {
      "version": "2.0",
      "fields": [
        {
          "name": "numero_devis",
          "display_name": "Numéro de devis",
          "data_type": "string",
          "required": true,
          "validation_pattern": "^[A-Z0-9\\-\\/]+$",
          "extraction_hints": ["Devis n°", "Numéro", "Référence", "N°"],
          "group": "identification"
        },
        {
          "name": "date_devis",
          "display_name": "Date du devis",
          "data_type": "date",
          "required": true,
          "format": "DD/MM/YYYY",
          "extraction_hints": ["Date :", "Le", "Fait le"],
          "group": "identification"
        },
        {
          "name": "beneficiaire_nom",
          "display_name": "Nom du bénéficiaire",
          "data_type": "string",
          "required": true,
          "post_processing": ["uppercase", "trim"],
          "extraction_hints": ["Client", "Bénéficiaire", "M.", "Mme"],
          "group": "beneficiary"
        },
        {
          "name": "beneficiaire_adresse",
          "display_name": "Adresse des travaux",
          "data_type": "address",
          "required": true,
          "extraction_hints": ["Adresse travaux", "Lieu d'intervention"],
          "group": "beneficiary"
        },
        {
          "name": "prime_cee",
          "display_name": "Prime CEE",
          "data_type": "currency",
          "required": true,
          "extraction_hints": ["Prime CEE", "Prime énergie", "Coup de pouce"],
          "group": "financial"
        },
        {
          "name": "montant_ttc",
          "display_name": "Montant TTC",
          "data_type": "currency",
          "required": true,
          "extraction_hints": ["Total TTC", "Montant TTC"],
          "group": "financial"
        },
        {
          "name": "signature_present",
          "display_name": "Signature présente",
          "data_type": "boolean",
          "required": true,
          "detection_type": "signature",
          "group": "signatures"
        },
        {
          "name": "bon_pour_accord",
          "display_name": "Mention Bon pour accord",
          "data_type": "boolean",
          "required": true,
          "detection_type": "handwriting",
          "extraction_hints": ["Bon pour accord", "Lu et approuvé"],
          "group": "signatures"
        },
        {
          "name": "date_signature",
          "display_name": "Date de signature",
          "data_type": "date",
          "required": true,
          "detection_type": "handwriting",
          "group": "signatures"
        }
      ]
    },
    
    "document_rules": [
      {
        "id": "devis_date_valid",
        "name": "Date devis valide",
        "condition": "date_devis <= today()",
        "severity": "ERROR",
        "message": "La date du devis ne peut pas être dans le futur"
      },
      {
        "id": "devis_prime_positive",
        "name": "Prime positive",
        "condition": "prime_cee > 0",
        "severity": "ERROR",
        "message": "La prime CEE doit être positive"
      },
      {
        "id": "devis_signature_complete",
        "name": "Signature complète",
        "condition": "signature_present == true && bon_pour_accord == true",
        "severity": "ERROR",
        "message": "Le devis doit être signé avec mention 'Bon pour accord'"
      }
    ]
  }
}
```

### 4.3 Validation Rules Configuration

Rules can be defined at multiple levels:

```json
{
  "rules": {
    "global_rules": [
      {
        "id": "global_date_format",
        "name": "Valid Date Format",
        "applies_to": "*",
        "condition": "is_valid_date(value)",
        "severity": "ERROR"
      }
    ],
    
    "document_rules": {
      "devis": [
        {
          "id": "devis_001",
          "name": "Prime CEE positive",
          "condition": "prime_cee > 0",
          "severity": "ERROR",
          "message": "La prime CEE doit être supérieure à 0€"
        }
      ],
      "facture": [
        {
          "id": "facture_001",
          "name": "Référence devis présente",
          "condition": "exists(reference_devis)",
          "severity": "ERROR",
          "message": "La facture doit référencer le devis"
        }
      ]
    },
    
    "cross_document_rules": [
      {
        "id": "cross_001",
        "name": "Prime CEE cohérente",
        "documents": ["devis", "facture", "cdc"],
        "condition": "devis.prime_cee == facture.prime_cee && devis.prime_cee == cdc.prime_montant",
        "severity": "ERROR",
        "message": "La prime CEE doit être identique sur tous les documents",
        "tolerance": 0.01
      },
      {
        "id": "cross_002",
        "name": "Date engagement avant travaux",
        "documents": ["devis", "facture"],
        "condition": "devis.date_signature < facture.date_debut_travaux",
        "severity": "ERROR",
        "message": "Le devis doit être signé avant le début des travaux"
      },
      {
        "id": "cross_003",
        "name": "Nom bénéficiaire cohérent",
        "documents": ["devis", "facture", "ah"],
        "condition": "similarity(devis.beneficiaire_nom, facture.client_nom) >= 0.90 && similarity(devis.beneficiaire_nom, ah.beneficiaire_nom) >= 0.90",
        "severity": "ERROR",
        "message": "Le nom du bénéficiaire doit être cohérent entre les documents"
      },
      {
        "id": "cross_004",
        "name": "Délai minimum 14 jours",
        "documents": ["devis", "facture"],
        "condition": "date_diff(facture.date_debut_travaux, devis.date_signature, 'days') >= 14",
        "severity": "WARNING",
        "message": "Un délai minimum de 14 jours est recommandé entre signature et travaux",
        "applies_to_processes": ["BAR-TH-*"]
      },
      {
        "id": "cross_005",
        "name": "Signatures cohérentes",
        "documents": ["devis", "ah", "cdc"],
        "condition": "signature_similarity(devis.signature, ah.signature_cadre_b, cdc.signature) >= 0.85",
        "severity": "WARNING",
        "message": "Les signatures semblent différentes entre les documents"
      }
    ],
    
    "process_specific_rules": {
      "BAR-TH-171": [
        {
          "id": "bar_th_171_001",
          "name": "ETAS minimum",
          "condition": "ah.etas >= 126",
          "severity": "ERROR",
          "message": "L'ETAS doit être supérieur ou égal à 126%"
        }
      ]
    }
  }
}
```

### 4.4 Rule Expression Language

```
SUPPORTED OPERATORS:
==, !=, <, >, <=, >=          # Comparison
&&, ||, !                      # Logical
+, -, *, /, %                  # Arithmetic

BUILT-IN FUNCTIONS:
exists(field)                  # Check if field exists and is not null
is_empty(field)                # Check if field is empty
len(field)                     # Length of string/array
trim(field)                    # Trim whitespace
lower(field)                   # Lowercase
upper(field)                   # Uppercase

DATE FUNCTIONS:
today()                        # Current date
date_diff(d1, d2, unit)        # Difference in days/months/years
is_valid_date(value)           # Check if valid date format
add_days(date, n)              # Add n days to date
year(date)                     # Extract year
month(date)                    # Extract month

STRING FUNCTIONS:
similarity(s1, s2)             # 0.0-1.0 similarity score
contains(s, substr)            # Check if contains substring
starts_with(s, prefix)         # Check if starts with
ends_with(s, suffix)           # Check if ends with
matches(s, regex)              # Regex match

NUMERIC FUNCTIONS:
abs(n)                         # Absolute value
round(n, decimals)             # Round to decimals
min(a, b, ...)                 # Minimum value
max(a, b, ...)                 # Maximum value

SPECIAL FUNCTIONS:
signature_similarity(...)      # Compare signature images
in_list(value, [...])          # Check if value in list
calculate_kwh_cumac(...)       # CEE-specific calculation
```

---

## Part 5: Screen Specifications

### 5.1 UI Component Library

All screens use **shadcn/ui** components with consistent theming:

```
BASE COMPONENTS (shadcn/ui):
├── Button (variants: default, destructive, outline, secondary, ghost, link)
├── Card (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
├── Dialog (DialogTrigger, DialogContent, DialogHeader, DialogTitle)
├── DropdownMenu
├── Input, Textarea
├── Label
├── Select (SelectTrigger, SelectContent, SelectItem)
├── Table (TableHeader, TableBody, TableRow, TableCell)
├── Tabs (TabsList, TabsTrigger, TabsContent)
├── Badge
├── Alert (AlertTitle, AlertDescription)
├── Separator
├── Skeleton (for loading states)
├── Toast (via Sonner)
├── Command (for search/command palette)
├── DataTable (with sorting, filtering, pagination)
└── Form (with react-hook-form + zod validation)

CUSTOM COMPONENTS:
├── DocumentViewer (PDF/image viewer with zoom, pan, annotations)
├── FieldEditor (inline field editing with confidence display)
├── RuleBuilder (visual rule creation interface)
├── ValidationBadge (pass/warning/error status)
├── ProcessFlow (visual process diagram)
├── SignatureComparison (side-by-side signature view)
└── KPICard (metric display with trend)
```

### 5.2 Screen: Dashboard

**URL:** `/dashboard`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Logo] CEE Validation    [Command+K Search]    [🔔] [User Avatar ▼] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  SIDEBAR (collapsible)          │  MAIN CONTENT                            │
│  ┌─────────────────────────┐   │  ┌─────────────────────────────────────┐ │
│  │ 📊 Dashboard            │   │  │  KPI CARDS (4 columns)              │ │
│  │ 📁 Dossiers             │   │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │ │
│  │ 📄 Documents            │   │  │  │Pending│ │Today │ │Accur.│ │Avg │ │ │
│  │ ─────────────────────   │   │  │  │  47  │ │ 156 │ │98.7%│ │4.2m│ │ │
│  │ ⚙️ Configuration        │   │  │  │  ↑12 │ │ ↑23 │ │ ↑0.2│ │↓0.3│ │ │
│  │   └─ Processes          │   │  │  └──────┘ └──────┘ └──────┘ └────┘ │ │
│  │   └─ Document Types     │   │  └─────────────────────────────────────┘ │
│  │   └─ Rules              │   │                                          │
│  │   └─ Field Schemas      │   │  ┌─────────────────────────────────────┐ │
│  │ ─────────────────────   │   │  │  DOSSIERS BY STATUS (Tabs)          │ │
│  │ 👥 Users                │   │  │  [All] [Pending] [Review] [Approved]│ │
│  │ 📈 Analytics            │   │  │  ┌─────────────────────────────────┐│ │
│  │ ⚡ Activity              │   │  │  │ DataTable with:                 ││ │
│  └─────────────────────────┘   │  │  │ - ID, Beneficiary, Process      ││ │
│                                 │  │  │ - Status badge, Confidence      ││ │
│                                 │  │  │ - Installer, Date, Actions      ││ │
│                                 │  │  │ [Sort] [Filter] [Search]        ││ │
│                                 │  │  └─────────────────────────────────┘│ │
│                                 │  └─────────────────────────────────────┘ │
│                                 │                                          │
│                                 │  ┌──────────────────┐ ┌───────────────┐ │
│                                 │  │ RECENT ACTIVITY  │ │ QUICK ACTIONS │ │
│                                 │  │ (live feed)      │ │ [+ New Dossier│ │
│                                 │  │ • #4521 approved │ │ [📤 Upload]   │ │
│                                 │  │ • #4520 flagged  │ │ [⚙️ Settings] │ │
│                                 │  └──────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Screen: Process Configuration

**URL:** `/config/processes`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROCESS CONFIGURATION                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [+ New Process]  [Import Template]  [Export]         Search: [___]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  PROCESS LIST (Cards)                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  BAR-TH-171                                    [Active] [Edit]  │ │ │
│  │  │  Pompe à chaleur air/eau                                        │ │ │
│  │  │  ─────────────────────────────────────────────────────────────  │ │ │
│  │  │  📄 6 documents required  |  📏 24 rules  |  📊 1,245 dossiers  │ │ │
│  │  │  Last updated: Nov 15, 2025                                     │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  BAR-TH-113                                    [Active] [Edit]  │ │ │
│  │  │  Chaudière biomasse individuelle                                │ │ │
│  │  │  ─────────────────────────────────────────────────────────────  │ │ │
│  │  │  📄 7 documents required  |  📏 28 rules  |  📊 523 dossiers    │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  PROCESS EDITOR (Dialog/Sheet)                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Edit Process: BAR-TH-171                                    [×]     │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │  TABS: [General] [Documents] [Rules] [Advanced]                      │ │
│  │                                                                       │ │
│  │  [General Tab]                                                        │ │
│  │  Code: [BAR-TH-171    ]    Name: [Pompe à chaleur air/eau       ]   │ │
│  │  Category: [CEE Residential ▼]    Version: [A46.3]                   │ │
│  │  Valid From: [2024-01-01]    Valid Until: [          ]              │ │
│  │  Description: [___________________________________________]          │ │
│  │  □ Is Coup de Pouce    □ Active                                     │ │
│  │                                                                       │ │
│  │  [Documents Tab]                                                      │ │
│  │  REQUIRED DOCUMENTS (drag to reorder):                               │ │
│  │  ┌─────────────────────────────────────────────────────────────┐    │ │
│  │  │ ≡ 1. Devis              [Required ▼]  [Configure Schema]    │    │ │
│  │  │ ≡ 2. Facture            [Required ▼]  [Configure Schema]    │    │ │
│  │  │ ≡ 3. Attestation (AH)   [Required ▼]  [Configure Schema]    │    │ │
│  │  │ ≡ 4. Cadre Contribution [Required ▼]  [Configure Schema]    │    │ │
│  │  │ ≡ 5. Avis d'impôt       [Conditional▼] [Configure Schema]   │    │ │
│  │  │     Condition: [beneficiary.precarite != 'CLASSIQUE']       │    │ │
│  │  │ ≡ 6. Photos             [Required ▼]  Min: [2] Max: [10]    │    │ │
│  │  │ [+ Add Document Type]                                        │    │ │
│  │  └─────────────────────────────────────────────────────────────┘    │ │
│  │                                                                       │ │
│  │  [Save Draft] [Preview] [Save & Activate]                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Screen: Document Type Configuration

**URL:** `/config/document-types`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DOCUMENT TYPE CONFIGURATION                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [+ New Document Type]  [Import]                   Search: [___________]   │
│                                                                             │
│  DOCUMENT TYPES (Table)                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Code     │ Name                  │ Fields │ Rules │ Status  │ Actions │ │
│  │──────────┼───────────────────────┼────────┼───────┼─────────┼─────────│ │
│  │ DEVIS    │ Devis (Quote)         │ 18     │ 5     │ System  │ [Edit]  │ │
│  │ FACTURE  │ Facture (Invoice)     │ 15     │ 4     │ System  │ [Edit]  │ │
│  │ AH       │ Attestation Honneur   │ 42     │ 12    │ System  │ [Edit]  │ │
│  │ CDC      │ Cadre de Contribution │ 8      │ 3     │ System  │ [Edit]  │ │
│  │ CUSTOM_1 │ My Custom Document    │ 6      │ 2     │ Custom  │ [Edit]  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  FIELD SCHEMA EDITOR (when editing document type)                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Document Type: Devis                                        [×]      │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │  TABS: [Fields] [Extraction Hints] [Rules] [Preview]                 │ │
│  │                                                                       │ │
│  │  FIELDS (drag to reorder)                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Field Name        │ Type     │ Required │ Group      │ Actions  │ │ │
│  │  │───────────────────┼──────────┼──────────┼────────────┼──────────│ │ │
│  │  │ numero_devis      │ String   │ ✓        │ Identity   │ [⚙️][🗑️]│ │ │
│  │  │ date_devis        │ Date     │ ✓        │ Identity   │ [⚙️][🗑️]│ │ │
│  │  │ beneficiaire_nom  │ String   │ ✓        │ Beneficiary│ [⚙️][🗑️]│ │ │
│  │  │ prime_cee         │ Currency │ ✓        │ Financial  │ [⚙️][🗑️]│ │ │
│  │  │ signature_present │ Boolean  │ ✓        │ Signatures │ [⚙️][🗑️]│ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │  [+ Add Field]                                                        │ │
│  │                                                                       │ │
│  │  FIELD EDITOR (expanded)                                              │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Field: prime_cee                                                │ │ │
│  │  │ Display Name: [Prime CEE              ]                         │ │ │
│  │  │ Data Type: [Currency ▼]    Required: [✓]                       │ │ │
│  │  │ Validation Pattern: [^[0-9]+(\.[0-9]{1,2})?$]                  │ │ │
│  │  │ Extraction Hints (comma-separated):                             │ │ │
│  │  │ [Prime CEE, Prime énergie, Coup de pouce, Prime versée]        │ │ │
│  │  │ Post-processing: [□ Uppercase] [□ Trim] [□ Remove spaces]      │ │ │
│  │  │ Cross-reference fields:                                         │ │ │
│  │  │ [+ Add] facture.prime_cee, cdc.prime_montant                   │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Screen: Rule Builder

**URL:** `/config/rules`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RULE CONFIGURATION                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TABS: [All Rules] [Document Rules] [Cross-Document] [Process-Specific]    │
│                                                                             │
│  [+ New Rule]  [Import]  [Export]              Search: [___________]       │
│                                                                             │
│  RULES LIST                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  CROSS_001 - Prime CEE Consistency                    [ON] 🟢  │ │ │
│  │  │  ─────────────────────────────────────────────────────────────  │ │ │
│  │  │  Type: Cross-Document | Severity: ERROR | Auto-reject: Yes     │ │ │
│  │  │  Documents: devis, facture, cdc                                 │ │ │
│  │  │  Condition: devis.prime_cee == facture.prime_cee == cdc.prime  │ │ │
│  │  │  [Edit] [Test] [Duplicate] [Disable]                           │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  DATE_001 - Engagement Before Work                    [ON] 🟢  │ │ │
│  │  │  ─────────────────────────────────────────────────────────────  │ │ │
│  │  │  Type: Cross-Document | Severity: ERROR | Auto-reject: Yes     │ │ │
│  │  │  Documents: devis, facture                                      │ │ │
│  │  │  Condition: devis.date_signature < facture.date_debut_travaux  │ │ │
│  │  │  [Edit] [Test] [Duplicate] [Disable]                           │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  RULE BUILDER (Dialog)                                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Create New Rule                                              [×]     │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │                                                                       │ │
│  │  Rule ID: [CUSTOM_001     ]    Name: [My Custom Rule            ]   │ │
│  │  Type: [Cross-Document ▼]      Severity: [ERROR ▼]                  │ │
│  │  Auto-reject on failure: [✓]                                        │ │
│  │                                                                       │ │
│  │  APPLIES TO:                                                          │ │
│  │  ○ All processes                                                     │ │
│  │  ● Specific processes: [Select...] BAR-TH-171, BAR-TH-113           │ │
│  │                                                                       │ │
│  │  CONDITION BUILDER:                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Mode: [Visual Builder ▼]                                       │ │ │
│  │  │                                                                 │ │ │
│  │  │  IF  [devis ▼].[prime_cee ▼]  [!= ▼]  [facture ▼].[prime_cee]  │ │ │
│  │  │  [+ Add AND condition]  [+ Add OR group]                        │ │ │
│  │  │                                                                 │ │ │
│  │  │  ─── OR write expression directly: ───                          │ │ │
│  │  │  ┌───────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │ abs(devis.prime_cee - facture.prime_cee) <= 1             │ │ │ │
│  │  │  └───────────────────────────────────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ERROR MESSAGE:                                                       │ │
│  │  [La prime CEE diffère entre le devis ({devis.prime_cee}€) et la   ]│ │
│  │  [facture ({facture.prime_cee}€)                                   ]│ │
│  │                                                                       │ │
│  │  [Test with Sample Data]  [Save Draft]  [Save & Activate]            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Screen: Document Upload

**URL:** `/upload`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEW DOSSIER - Document Upload                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP INDICATOR: [1. Select Process] → [2. Upload] → [3. Review] → [Done] │
│                                                                             │
│  STEP 1: SELECT PROCESS                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Process: [Search or select process...                            ▼] │ │
│  │                                                                       │ │
│  │  Selected: BAR-TH-171 - Pompe à chaleur air/eau                      │ │
│  │                                                                       │ │
│  │  REQUIRED DOCUMENTS:                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ○ Devis signé                              Required             │ │ │
│  │  │ ○ Facture                                  Required             │ │ │
│  │  │ ○ Attestation sur l'Honneur               Required             │ │ │
│  │  │ ○ Cadre de Contribution                   Required             │ │ │
│  │  │ ○ Avis d'impôt                            If precarity         │ │ │
│  │  │ ○ Photos avant/après (min. 2)             Required             │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  STEP 2: UPLOAD DOCUMENTS                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                     📁                                          │ │ │
│  │  │                                                                 │ │ │
│  │  │         Drag & drop files here, or click to browse              │ │ │
│  │  │                                                                 │ │ │
│  │  │         PDF, JPG, PNG • Max 20MB per file                       │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  UPLOADED FILES:                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ 📄 devis_client.pdf           │ Analyzing... ⏳                 │ │ │
│  │  │ 📄 facture_2024.pdf           │ Facture ✓            [🗑️]      │ │ │
│  │  │ 📄 AH_complet.pdf             │ Attestation ✓        [🗑️]      │ │ │
│  │  │ 📄 CDC_signe.pdf              │ Cadre Contribution ✓ [🗑️]      │ │ │
│  │  │ 🖼️ photo_avant.jpg            │ Photo ✓              [🗑️]      │ │ │
│  │  │ 🖼️ photo_apres.jpg            │ Photo ✓              [🗑️]      │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  Status: 5/6 documents uploaded • Missing: Avis d'impôt (optional)   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [← Back]                                              [Submit for Review →]│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Screen: Human Validation UI

**URL:** `/validation/{dossier_id}`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DOSSIER VALIDATION - #4521                              [← Back to List]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HEADER INFO (Card)                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Beneficiary: BADJI Mehenna                                           │ │
│  │  Address: 10 RUE DES TERRES ROUGES, 77680 ROISSY EN BRIE             │ │
│  │  Process: BAR-TH-171 | Installer: MHG ENERGIES | Prime: 4,000€       │ │
│  │  Status: [⚠️ Awaiting Review]    Confidence: [████████░░] 87%         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  DOCUMENT TABS                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ [Devis ✓] [Facture ✓] [AH ⚠️] [CDC ✓] [Photos ✓] [📊 Summary]        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  SPLIT VIEW                                                                 │
│  ┌─────────────────────────────┬─────────────────────────────────────────┐ │
│  │  DOCUMENT VIEWER            │  EXTRACTED FIELDS                       │ │
│  │  ┌───────────────────────┐ │  ┌─────────────────────────────────────┐│ │
│  │  │                       │ │  │  GROUP: Identification               ││ │
│  │  │                       │ │  │  ┌─────────────────────────────────┐││ │
│  │  │   [PDF/Image View]    │ │  │  │ Numéro devis:                   │││ │
│  │  │   with highlighted    │ │  │  │ [2024-BADJI-171    ] ✓ 98%  [📍]│││ │
│  │  │   extraction regions  │ │  │  └─────────────────────────────────┘││ │
│  │  │                       │ │  │  ┌─────────────────────────────────┐││ │
│  │  │                       │ │  │  │ Date devis:                     │││ │
│  │  │   Click field to      │ │  │  │ [18/10/2024        ] ✓ 99%  [📍]│││ │
│  │  │   highlight location  │ │  │  └─────────────────────────────────┘││ │
│  │  │                       │ │  │                                     ││ │
│  │  │                       │ │  │  GROUP: Beneficiary                 ││ │
│  │  │                       │ │  │  ┌─────────────────────────────────┐││ │
│  │  │                       │ │  │  │ Nom:                            │││ │
│  │  │                       │ │  │  │ [BADJI Mehenna     ] ✓ 97%  [📍]│││ │
│  │  └───────────────────────┘ │  │  └─────────────────────────────────┘││ │
│  │                             │  │                                     ││ │
│  │  [◀] Page 1/2 [▶]          │  │  GROUP: Financial                   ││ │
│  │  Zoom: [100%▼] [Fit] [Full]│  │  ┌─────────────────────────────────┐││ │
│  │                             │  │  │ Prime CEE:                      │││ │
│  │  [Compare with other docs] │  │  │ [4,000.00 €        ] ✓ 99%  [📍]│││ │
│  │                             │  │  └─────────────────────────────────┘││ │
│  └─────────────────────────────┘ │  └─────────────────────────────────────┘│ │
│                                                                             │
│  VALIDATION RESULTS (Collapsible)                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ✓ PASSED (18 rules)                                         [Expand]│ │
│  │  ⚠️ WARNINGS (2)                                              [Expand]│ │
│  │     • Délai < 14 jours entre engagement et travaux (12 jours)        │ │
│  │     • Signature AH légèrement différente                             │ │
│  │  ✗ ERRORS (0)                                                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ACTIONS                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Comment: [Add note...                                            ]  │ │
│  │  [Request Documents]  [❌ Reject]  [✓ Approve with Warnings]        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.8 Screen: Billing Summary

**URL:** `/billing/{dossier_id}`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BILLING SUMMARY - Dossier #4521                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DOSSIER INFORMATION (Card)                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Beneficiary: BADJI Mehenna                                           │ │
│  │  Process: BAR-TH-171 - Pompe à chaleur air/eau                       │ │
│  │  Installer: MHG ENERGIES (SIRET: 433 005 482)                        │ │
│  │  Validated: Nov 27, 2025 14:32 by Marie DUPONT                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  CEE CALCULATION (Card)                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  Operation Code:           BAR-TH-171                                │ │
│  │  Zone climatique:          H1                                        │ │
│  │  Surface chauffée:         120 m²                                    │ │
│  │  Type logement:            Maison individuelle                       │ │
│  │  Énergie remplacée:        Fioul                                     │ │
│  │  Précarité:                Modeste                                   │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │  kWh cumac calculés:       42,800                                    │ │
│  │  Prix unitaire:            0.00935 €/kWh                             │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │  PRIME CEE:                [4,000.00 €]                              │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  PAYMENT BREAKDOWN (Card)                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  90% on validation:        3,600.00 €                                │ │
│  │  10% on EMMY:                400.00 €                                │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │  Payment terms:            15 days                                   │ │
│  │  Expected payment:         Dec 12, 2025                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ACTIONS                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [📄 Generate Invoice PDF]  [📧 Email to Installer]  [✓ Mark Billed] │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Data Models

### 6.1 Database Schema (PostgreSQL)

```sql
-- PROCESSES (CEE operations or custom workflows)
CREATE TABLE processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    valid_from DATE,
    valid_until DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- DOCUMENT TYPES
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    classification_hints TEXT[],
    expected_pages_min INT DEFAULT 1,
    expected_pages_max INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- FIELD SCHEMAS (per document type)
CREATE TABLE field_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type_id UUID REFERENCES document_types(id),
    version VARCHAR(20) DEFAULT '1.0',
    fields JSONB NOT NULL,  -- Array of field definitions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PROCESS-DOCUMENT REQUIREMENTS
CREATE TABLE process_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES processes(id),
    document_type_id UUID REFERENCES document_types(id),
    is_required BOOLEAN DEFAULT true,
    condition_expression TEXT,  -- When conditionally required
    min_count INT DEFAULT 1,
    max_count INT,
    display_order INT DEFAULT 0,
    UNIQUE(process_id, document_type_id)
);

-- VALIDATION RULES
CREATE TABLE validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,  -- 'document', 'cross_document', 'global'
    severity VARCHAR(20) DEFAULT 'ERROR',  -- 'ERROR', 'WARNING', 'INFO'
    auto_reject BOOLEAN DEFAULT false,
    condition_expression TEXT NOT NULL,
    error_message_template TEXT NOT NULL,
    applies_to_documents UUID[],  -- For document rules
    applies_to_processes UUID[],  -- NULL means all processes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- DOSSIERS
CREATE TABLE dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    process_id UUID REFERENCES processes(id),
    installer_id UUID REFERENCES installers(id),
    status VARCHAR(50) DEFAULT 'NEW',
    beneficiary JSONB NOT NULL,
    work_address JSONB NOT NULL,
    prime_amount DECIMAL(10,2),
    kwh_cumac INT,
    confidence_score FLOAT,
    validated_at TIMESTAMP,
    validated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id),
    document_type_id UUID REFERENCES document_types(id),
    original_filename VARCHAR(255),
    storage_path VARCHAR(500),
    mime_type VARCHAR(100),
    file_size INT,
    page_count INT,
    classification_confidence FLOAT,
    processing_status VARCHAR(50) DEFAULT 'PENDING',
    extracted_fields JSONB,
    signatures JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- VALIDATION RESULTS
CREATE TABLE validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id),
    rule_id UUID REFERENCES validation_rules(id),
    status VARCHAR(20) NOT NULL,  -- 'PASSED', 'FAILED', 'WARNING'
    details JSONB,
    overridden_by UUID REFERENCES users(id),
    override_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- INSTALLERS
CREATE TABLE installers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raison_sociale VARCHAR(255) NOT NULL,
    siret VARCHAR(14) UNIQUE NOT NULL,
    siren VARCHAR(9),
    address JSONB,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    rge_number VARCHAR(50),
    rge_valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'validator',
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search indexes
CREATE INDEX idx_dossiers_search ON dossiers 
    USING GIN (to_tsvector('french', beneficiary->>'nom' || ' ' || beneficiary->>'prenom'));
CREATE INDEX idx_documents_search ON documents 
    USING GIN (to_tsvector('french', original_filename));
```

---

## Part 7: Motia Steps Implementation

### 7.1 Project Structure

```
cee-validation/
├── motia.config.js              # Motia configuration
├── docker-compose.yml           # Docker stack
├── .env                         # Environment variables
│
├── steps/                       # Motia Steps
│   ├── api/                     # API endpoints
│   │   ├── upload_document.step.py
│   │   ├── get_dossier.step.py
│   │   ├── create_process.step.py
│   │   ├── create_rule.step.py
│   │   ├── validate_dossier.step.py
│   │   └── approve_dossier.step.py
│   │
│   ├── events/                  # Event handlers
│   │   ├── classify_document.step.py
│   │   ├── extract_fields.step.py
│   │   ├── detect_signatures.step.py
│   │   ├── run_validation.step.py
│   │   └── generate_billing.step.py
│   │
│   └── scheduled/               # Scheduled tasks
│       ├── cleanup_old_files.step.py
│       └── sync_rge_database.step.py
│
├── services/                    # Shared services
│   ├── gemini_service.py
│   ├── rule_engine.py
│   ├── storage_service.py
│   ├── search_service.py
│   └── db_service.py
│
├── models/                      # Pydantic models
│   ├── dossier.py
│   ├── document.py
│   ├── process.py
│   └── rule.py
│
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── config/
│   │   │   ├── processes/
│   │   │   ├── document-types/
│   │   │   └── rules/
│   │   ├── upload/
│   │   ├── validation/
│   │   └── billing/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── document-viewer.tsx
│   │   ├── field-editor.tsx
│   │   ├── rule-builder.tsx
│   │   └── ...
│   └── lib/
│       └── api.ts
│
└── tests/
    ├── steps/
    └── services/
```

### 7.2 Example Steps

```python
# steps/api/upload_document.step.py

config = {
    "name": "UploadDocument",
    "type": "api",
    "path": "/api/documents/upload",
    "method": "POST",
    "emits": ["document.uploaded"]
}

async def handler(req, context):
    """
    Handle document upload.
    Stores file in MinIO and creates document record.
    """
    from services.storage_service import StorageService
    from services.db_service import DBService
    
    storage = StorageService()
    db = DBService()
    
    file = req.files.get("file")
    dossier_id = req.body.get("dossier_id")
    
    # Store file
    storage_path = await storage.upload(file, dossier_id)
    
    # Create document record
    document = await db.create_document({
        "dossier_id": dossier_id,
        "original_filename": file.filename,
        "storage_path": storage_path,
        "mime_type": file.content_type,
        "file_size": len(file.read()),
        "processing_status": "PENDING"
    })
    
    # Emit event for processing
    await context.emit({
        "topic": "document.uploaded",
        "data": {
            "document_id": str(document.id),
            "dossier_id": dossier_id,
            "storage_path": storage_path
        }
    })
    
    return {
        "status": 200,
        "body": {
            "document_id": str(document.id),
            "message": "Document uploaded successfully"
        }
    }
```

```python
# steps/events/classify_document.step.py

config = {
    "name": "ClassifyDocument",
    "type": "event",
    "subscribes": ["document.uploaded"],
    "emits": ["document.classified"]
}

async def handler(event, context):
    """
    Classify uploaded document using Gemini 2.5.
    """
    from services.gemini_service import GeminiService
    from services.storage_service import StorageService
    from services.db_service import DBService
    
    gemini = GeminiService()
    storage = StorageService()
    db = DBService()
    
    document_id = event["document_id"]
    storage_path = event["storage_path"]
    
    context.logger.info(f"Classifying document {document_id}")
    
    # Get document images
    images = await storage.get_document_images(storage_path)
    
    # Get available document types for this process
    dossier = await db.get_dossier(event["dossier_id"])
    process = await db.get_process(dossier.process_id)
    document_types = await db.get_document_types_for_process(process.id)
    
    # Classify using Gemini
    result = await gemini.classify_document(images, document_types)
    
    # Update document record
    await db.update_document(document_id, {
        "document_type_id": result["document_type"],
        "classification_confidence": result["confidence"],
        "processing_status": "CLASSIFIED"
    })
    
    # Emit for next step
    await context.emit({
        "topic": "document.classified",
        "data": {
            "document_id": document_id,
            "document_type": result["document_type"],
            "confidence": result["confidence"]
        }
    })
    
    context.logger.info(f"Document {document_id} classified as {result['document_type']}")
```

```python
# steps/events/extract_fields.step.py

config = {
    "name": "ExtractFields",
    "type": "event",
    "subscribes": ["document.classified"],
    "emits": ["document.fields_extracted"]
}

async def handler(event, context):
    """
    Extract fields from document using Gemini 2.5.
    """
    from services.gemini_service import GeminiService
    from services.storage_service import StorageService
    from services.db_service import DBService
    
    gemini = GeminiService()
    storage = StorageService()
    db = DBService()
    
    document_id = event["document_id"]
    document_type = event["document_type"]
    
    context.logger.info(f"Extracting fields from document {document_id}")
    
    # Get document and schema
    document = await db.get_document(document_id)
    schema = await db.get_field_schema(document_type)
    images = await storage.get_document_images(document.storage_path)
    
    # Extract fields using Gemini
    result = await gemini.extract_fields(images, schema, document_type)
    
    # Update document with extracted fields
    await db.update_document(document_id, {
        "extracted_fields": result["fields"],
        "processing_status": "FIELDS_EXTRACTED"
    })
    
    # Emit for signature detection
    await context.emit({
        "topic": "document.fields_extracted",
        "data": {
            "document_id": document_id,
            "fields": result["fields"]
        }
    })
```

```python
# steps/events/run_validation.step.py

config = {
    "name": "RunValidation",
    "type": "event",
    "subscribes": ["dossier.ready_for_validation"],
    "emits": ["dossier.validation_complete"]
}

async def handler(event, context):
    """
    Run all validation rules on a dossier.
    """
    from services.rule_engine import RuleEngine
    from services.db_service import DBService
    
    rule_engine = RuleEngine()
    db = DBService()
    
    dossier_id = event["dossier_id"]
    context.logger.info(f"Validating dossier {dossier_id}")
    
    # Get dossier with all documents
    dossier = await db.get_dossier_with_documents(dossier_id)
    process = await db.get_process(dossier.process_id)
    
    # Build validation context
    validation_context = rule_engine.build_context(dossier)
    
    # Get applicable rules
    rules = await db.get_rules_for_process(process.id)
    
    # Evaluate each rule
    results = []
    for rule in rules:
        result = rule_engine.evaluate(rule, validation_context)
        results.append(result)
        
        # Save result
        await db.create_validation_result({
            "dossier_id": dossier_id,
            "rule_id": rule.id,
            "status": result["status"],
            "details": result["details"]
        })
    
    # Calculate overall status
    has_errors = any(r["status"] == "FAILED" for r in results)
    has_warnings = any(r["status"] == "WARNING" for r in results)
    
    status = "REQUIRES_REVIEW" if has_errors else ("APPROVED_WITH_WARNINGS" if has_warnings else "APPROVED")
    
    # Update dossier status
    await db.update_dossier(dossier_id, {
        "status": status,
        "confidence_score": rule_engine.calculate_confidence(results)
    })
    
    await context.emit({
        "topic": "dossier.validation_complete",
        "data": {
            "dossier_id": dossier_id,
            "status": status,
            "results_summary": {
                "passed": sum(1 for r in results if r["status"] == "PASSED"),
                "warnings": sum(1 for r in results if r["status"] == "WARNING"),
                "errors": sum(1 for r in results if r["status"] == "FAILED")
            }
        }
    })
```

---

## Part 8: Docker Deployment

### 8.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # Motia Backend
  motia:
    build:
      context: .
      dockerfile: Dockerfile.motia
    ports:
      - "3001:3001"
      - "3002:3002"  # Workbench
    environment:
      - DATABASE_URL=postgresql://cee:cee_password@postgres:5432/cee_validation
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - Typesense_URL=http://Typesense:7700
      - Typesense_KEY=${Typesense_KEY}
    depends_on:
      - postgres
      - redis
      - minio
      - Typesense
    volumes:
      - ./steps:/app/steps
      - ./services:/app/services
    restart: unless-stopped

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - motia
    restart: unless-stopped

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=cee
      - POSTGRES_PASSWORD=cee_password
      - POSTGRES_DB=cee_validation
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"  # Console
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    restart: unless-stopped

  # Typesense (lightweight search)
  Typesense:
    image: getmeili/Typesense:v1.6
    ports:
      - "7700:7700"
    environment:
      - MEILI_MASTER_KEY=${Typesense_KEY:-masterKey123}
    volumes:
      - Typesense_data:/meili_data
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - frontend
      - motia
    restart: unless-stopped

  # Signoz (optional - for monitoring)
  # Uncomment to enable
  # signoz:
  #   image: signoz/signoz:latest
  #   ports:
  #     - "3301:3301"
  #   volumes:
  #     - signoz_data:/var/lib/signoz

volumes:
  postgres_data:
  redis_data:
  minio_data:
  Typesense_data:
```

### 8.2 Dockerfile.motia

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for Motia CLI
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Motia CLI
RUN npm install -g motia@latest

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose ports
EXPOSE 3001 3002

# Start Motia
CMD ["motia", "dev"]
```

### 8.3 requirements.txt

```
# Motia Python support
motia

# Database
asyncpg
sqlalchemy[asyncio]
alembic

# AI/ML
google-generativeai
pillow
pdf2image

# Storage
minio
python-magic

# Search
Typesense

# Utilities
pydantic
python-dotenv
httpx
tenacity

# Monitoring (choose one)
sentry-sdk
# opentelemetry-sdk  # for Signoz
```

---

## Part 9: Monitoring Options

### Option A: Sentry (Recommended for Simplicity)

```python
# In services/monitoring.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)
```

### Option B: Signoz (Self-Hosted, Full APM)

```yaml
# Add to docker-compose.yml
signoz:
  image: signoz/signoz-otel-collector:latest
  ports:
    - "4317:4317"   # OTLP gRPC
    - "4318:4318"   # OTLP HTTP
```

### Option C: Datadog (Enterprise)

```python
# In services/monitoring.py
from ddtrace import tracer, patch_all
patch_all()
```

---

## Part 10: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
- [ ] Docker Compose stack setup
- [ ] PostgreSQL schema initialization
- [ ] Motia project structure
- [ ] Basic API steps (CRUD for processes, document types)
- [ ] MinIO integration

### Phase 2: Core Pipeline (Weeks 4-6)
- [ ] Gemini 2.5 integration
- [ ] Document classification step
- [ ] Field extraction step
- [ ] Signature detection step
- [ ] Typesense integration

### Phase 3: Configuration UI (Weeks 7-9)
- [ ] Next.js + shadcn/ui setup
- [ ] Process configuration screen
- [ ] Document type configuration screen
- [ ] Field schema editor
- [ ] Rule builder

### Phase 4: Validation (Weeks 10-12)
- [ ] Rule engine implementation
- [ ] Cross-document validation
- [ ] Human validation UI
- [ ] Document viewer component

### Phase 5: Billing & Polish (Weeks 13-15)
- [ ] Billing summary screen
- [ ] Email notifications
- [ ] Dashboard with KPIs
- [ ] Monitoring setup (Sentry/Signoz)

### Phase 6: Production (Weeks 16-18)
- [ ] Security hardening
- [ ] Performance optimization
- [ ] User documentation
- [ ] Deployment scripts

---

## Appendix: Quick Start

```bash
# 1. Clone repository
git clone https://github.com/valoren/cee-validation.git
cd cee-validation

# 2. Create environment file
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# 3. Start services
docker-compose up -d

# 4. Initialize database
docker-compose exec motia python scripts/init_db.py

# 5. Access application
# Frontend: http://localhost:3000
# Motia Workbench: http://localhost:3002
# MinIO Console: http://localhost:9001
# Typesense: http://localhost:7700
```

---

*End of Document*
