# CEE Validation System - Backend Architecture Design

**Version:** 2.0
**Date:** November 2025
**Framework:** MOTIA (https://www.motia.dev)
**Primary Language:** Python

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [MOTIA Framework Integration](#motia-framework-integration)
4. [Folder Structure](#folder-structure)
5. [API Endpoints Specification](#api-endpoints-specification)
6. [Database Schema](#database-schema)
7. [AI Model Abstraction Layer](#ai-model-abstraction-layer)
8. [Evaluation-Driven Improvement System](#evaluation-driven-improvement-system)
9. [Activity Logging & Analytics](#activity-logging--analytics)
10. [Search Infrastructure (Typesense)](#search-infrastructure-typesense)
11. [Rule Engine Design](#rule-engine-design)
12. [State Management & Caching](#state-management--caching)
13. [Implementation Recommendations](#implementation-recommendations)

---

## Executive Summary

This document outlines a comprehensive backend architecture for the CEE (Certificat d'Économie d'Énergie) document validation system using the MOTIA framework with **Python as the primary language**. The system is designed with:

- **Python End-to-End**: All backend code written in Python for consistency and AI/ML integration
- **Model Agnostic AI Layer**: Plug-and-play architecture for switching AI providers
- **Event-Driven Workflows**: Using MOTIA's step-based architecture
- **MOTIA Built-in State Management**: Leveraging MOTIA's native caching with Redis adapter for production
- **Comprehensive Activity Logging**: Full audit trail for all operations
- **Evaluation-Driven Improvement**: Human feedback loop for continuous model improvement
- **Configurable Rule Engine**: Version-controlled validation rules for CEE processes

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CEE VALIDATION SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           NEXT.JS FRONTEND                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │ │
│  │  │ Installer │  │ Validator │  │   Admin  │  │Analytics │  │Configuration │ │ │
│  │  │  Portal   │  │    UI    │  │  Console │  │Dashboard │  │   Studio     │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         MOTIA BACKEND FRAMEWORK                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                           API LAYER (Steps)                          │   │ │
│  │  │   REST Endpoints │ Authentication │ Rate Limiting │ Validation      │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  │                                       │                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                       EVENT-DRIVEN WORKFLOWS                         │   │ │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │   │ │
│  │  │  │ Document  │  │Extraction │  │Validation │  │    Billing        │ │   │ │
│  │  │  │ Processing│  │ Pipeline  │  │ Pipeline  │  │    Workflow       │ │   │ │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  │                                       │                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                     SERVICE LAYER (Core Services)                    │   │ │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │   │ │
│  │  │  │Document│ │ Rule   │ │Dossier │ │  User  │ │Billing │ │Activity│ │   │ │
│  │  │  │Service │ │ Engine │ │Service │ │Service │ │Service │ │Logger  │ │   │ │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  │                                       │                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    AI ABSTRACTION LAYER (Model Agnostic)             │   │ │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │   │ │
│  │  │  │   OCR      │  │ Document   │  │   Field    │  │   Signature    │ │   │ │
│  │  │  │  Provider  │  │Classification│ │ Extraction │  │   Detection    │ │   │ │
│  │  │  │  Adapter   │  │   Adapter   │  │   Adapter  │  │    Adapter     │ │   │ │
│  │  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘ │   │ │
│  │  └─────────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATA LAYER                                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │
│  │  │PostgreSQL│ │  Redis   │ │ S3/MinIO │ │Typesense │ │  Feedback Store  │ │ │
│  │  │(Primary) │ │ (Cache)  │ │(Storage) │ │ (Search) │ │   (Training)     │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## MOTIA Framework Integration

### Why MOTIA with Python?

MOTIA provides an event-driven workflow orchestration framework with **full Python support** for all step types. This makes it ideal for the CEE validation system:

1. **Native Python Support**: API, Event, Cron, and NOOP steps all work with Python
2. **Step-Based Architecture**: Each processing stage is an independent, testable step
3. **Event-Driven Design**: Loose coupling between processing stages
4. **Built-in State Management**: Memory, File, and Redis adapters with TTL support
5. **Streams**: Real-time updates with Pydantic schema validation
6. **Workbench UI**: Visual debugging and monitoring
7. **AI/ML Integration**: Python enables seamless integration with AI libraries

### Python Step Structure

```python
# steps/api/dossiers/create_dossier.step.py

config = {
    "type": "api",
    "name": "CreateDossier",
    "description": "Creates a new dossier for CEE validation",
    "path": "/api/dossiers",
    "method": "POST",
    "emits": ["dossier.created"],
    "flows": ["DossierManagement"],
    "bodySchema": {
        "type": "object",
        "properties": {
            "installer_id": {"type": "string"},
            "process_code": {"type": "string"},
            "beneficiary": {"type": "object"}
        },
        "required": ["installer_id", "process_code", "beneficiary"]
    }
}

async def handler(req, ctx):
    """Handle dossier creation request."""
    data = req.body

    # Create dossier in database
    dossier = await create_dossier(data)

    # Log activity
    ctx.logger.info("Dossier created", {"dossier_id": dossier["id"]})

    # Emit event for downstream processing
    await ctx.emit({
        "topic": "dossier.created",
        "data": {"dossier_id": dossier["id"], "process_code": data["process_code"]}
    })

    return {"status": 201, "body": dossier}
```

### Core MOTIA Concepts Used

| Concept | Usage in CEE System |
|---------|-------------------|
| **API Steps** | REST endpoints for UI and external integrations |
| **Event Steps** | Document processing pipeline stages |
| **Cron Steps** | Scheduled tasks (cleanup, reports, RGE verification) |
| **Streams** | Real-time validation progress updates |
| **State** | Dossier state management, extraction caching (Redis in production) |
| **Flows** | Logical grouping of related workflows |

---

## Folder Structure

```
cee-validation-backend/
├── motia.config.yaml                  # MOTIA configuration
├── pyproject.toml                     # Python project configuration
├── requirements.txt                   # Python dependencies
├── .env.example
│
├── steps/                             # MOTIA Steps (workflows)
│   ├── api/                           # API Steps (REST endpoints)
│   │   ├── auth/
│   │   │   ├── login.step.py
│   │   │   ├── logout.step.py
│   │   │   ├── refresh_token.step.py
│   │   │   └── forgot_password.step.py
│   │   │
│   │   ├── dossiers/
│   │   │   ├── create_dossier.step.py
│   │   │   ├── get_dossier.step.py
│   │   │   ├── list_dossiers.step.py
│   │   │   ├── update_dossier.step.py
│   │   │   ├── assign_validator.step.py
│   │   │   └── delete_dossier.step.py
│   │   │
│   │   ├── documents/
│   │   │   ├── upload_document.step.py
│   │   │   ├── get_document.step.py
│   │   │   ├── list_documents.step.py
│   │   │   ├── download_document.step.py
│   │   │   └── reprocess_document.step.py
│   │   │
│   │   ├── validation/
│   │   │   ├── get_validation_state.step.py
│   │   │   ├── update_field.step.py
│   │   │   ├── confirm_field.step.py
│   │   │   ├── override_rule.step.py
│   │   │   ├── approve_dossier.step.py
│   │   │   ├── reject_dossier.step.py
│   │   │   └── save_progress.step.py
│   │   │
│   │   ├── feedback/
│   │   │   ├── submit_feedback.step.py
│   │   │   ├── get_feedback.step.py
│   │   │   ├── list_feedback.step.py
│   │   │   └── export_training_data.step.py
│   │   │
│   │   ├── processes/
│   │   │   ├── create_process.step.py
│   │   │   ├── get_process.step.py
│   │   │   ├── list_processes.step.py
│   │   │   ├── update_process.step.py
│   │   │   └── clone_process.step.py
│   │   │
│   │   ├── rules/
│   │   │   ├── create_rule.step.py
│   │   │   ├── get_rule.step.py
│   │   │   ├── list_rules.step.py
│   │   │   ├── update_rule.step.py
│   │   │   ├── test_rule.step.py
│   │   │   └── toggle_rule.step.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── create_schema.step.py
│   │   │   ├── get_schema.step.py
│   │   │   ├── list_schemas.step.py
│   │   │   └── update_schema.step.py
│   │   │
│   │   ├── users/
│   │   │   ├── create_user.step.py
│   │   │   ├── get_user.step.py
│   │   │   ├── list_users.step.py
│   │   │   ├── update_user.step.py
│   │   │   └── deactivate_user.step.py
│   │   │
│   │   ├── installers/
│   │   │   ├── create_installer.step.py
│   │   │   ├── get_installer.step.py
│   │   │   ├── list_installers.step.py
│   │   │   ├── update_installer.step.py
│   │   │   └── verify_rge.step.py
│   │   │
│   │   ├── billing/
│   │   │   ├── get_billing_summary.step.py
│   │   │   ├── list_billable_dossiers.step.py
│   │   │   ├── generate_invoice.step.py
│   │   │   ├── record_payment.step.py
│   │   │   └── export_billing.step.py
│   │   │
│   │   ├── analytics/
│   │   │   ├── get_dashboard_metrics.step.py
│   │   │   ├── get_validation_stats.step.py
│   │   │   ├── get_model_performance.step.py
│   │   │   └── export_analytics.step.py
│   │   │
│   │   ├── activity/
│   │   │   ├── list_activities.step.py
│   │   │   └── get_activity_details.step.py
│   │   │
│   │   ├── search/
│   │   │   ├── search_dossiers.step.py
│   │   │   ├── search_documents.step.py
│   │   │   └── global_search.step.py
│   │   │
│   │   └── ai_config/
│   │       ├── get_ai_config.step.py
│   │       ├── update_ai_config.step.py
│   │       ├── list_providers.step.py
│   │       └── test_provider.step.py
│   │
│   ├── events/                        # Event Steps (processing pipelines)
│   │   ├── document_processing/
│   │   │   ├── classify_document.step.py
│   │   │   ├── extract_text_ocr.step.py
│   │   │   ├── extract_fields.step.py
│   │   │   ├── detect_signatures.step.py
│   │   │   └── validate_extraction.step.py
│   │   │
│   │   ├── bulk_upload/               # Bulk Upload Processing Pipeline
│   │   │   ├── split_pdf_document.step.py      # Split multi-page PDFs
│   │   │   ├── detect_process_codes.step.py    # Extract CEE codes from attestations
│   │   │   ├── validate_document_completeness.step.py  # Check required docs
│   │   │   ├── send_missing_documents_email.step.py    # Notify installer
│   │   │   └── finalize_bulk_upload.step.py    # Complete processing
│   │   │
│   │   ├── validation/
│   │   │   ├── run_document_rules.step.py
│   │   │   ├── run_cross_document_rules.step.py
│   │   │   ├── calculate_confidence.step.py
│   │   │   └── determine_priority.step.py
│   │   │
│   │   ├── feedback/
│   │   │   ├── process_correction.step.py
│   │   │   ├── update_training_dataset.step.py
│   │   │   └── trigger_model_evaluation.step.py
│   │   │
│   │   ├── notifications/
│   │   │   ├── send_email.step.py
│   │   │   ├── send_webhook.step.py
│   │   │   └── notify_installer.step.py
│   │   │
│   │   └── billing/
│   │       ├── calculate_cee_premium.step.py
│   │       ├── generate_invoice_pdf.step.py
│   │       └── process_payment.step.py
│   │
│   └── cron/                          # Cron Steps (scheduled tasks)
│       ├── cleanup_stale_uploads.step.py
│       ├── verify_rge_status.step.py
│       ├── generate_daily_report.step.py
│       ├── sync_typesense_index.step.py
│       └── archive_old_dossiers.step.py
│
├── streams/                           # MOTIA Streams (real-time updates)
│   ├── dossier_processing.stream.py
│   ├── validation_progress.stream.py
│   └── extraction_status.stream.py
│
├── services/                          # Core Business Services (Python packages)
│   ├── __init__.py
│   ├── ai/                            # AI Abstraction Layer
│   │   ├── __init__.py
│   │   ├── base_provider.py           # Abstract base class
│   │   ├── provider_factory.py        # Factory for creating providers
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── openai_provider.py
│   │   │   ├── anthropic_provider.py
│   │   │   ├── mistral_provider.py
│   │   │   └── local_provider.py      # Ollama, vLLM
│   │   ├── ocr/
│   │   │   ├── __init__.py
│   │   │   ├── base_ocr.py
│   │   │   ├── docling_provider.py
│   │   │   └── paddle_ocr_provider.py
│   │   └── extraction/
│   │       ├── __init__.py
│   │       ├── base_extractor.py
│   │       ├── vlm_extractor.py
│   │       └── template_extractor.py
│   │
│   ├── rules/                         # Rule Engine
│   │   ├── __init__.py
│   │   ├── rule_engine.py
│   │   ├── rule_parser.py
│   │   ├── rule_evaluator.py
│   │   ├── functions/
│   │   │   ├── __init__.py
│   │   │   ├── date_functions.py
│   │   │   ├── string_functions.py
│   │   │   ├── numeric_functions.py
│   │   │   └── cee_functions.py
│   │   └── validators/
│   │       ├── __init__.py
│   │       ├── document_validator.py
│   │       └── cross_document_validator.py
│   │
│   ├── feedback/                      # Feedback & Training System
│   │   ├── __init__.py
│   │   ├── feedback_collector.py
│   │   ├── training_dataset_generator.py
│   │   └── model_evaluator.py
│   │
│   ├── search/                        # Typesense Integration
│   │   ├── __init__.py
│   │   ├── typesense_client.py
│   │   ├── indexers/
│   │   │   ├── __init__.py
│   │   │   ├── dossier_indexer.py
│   │   │   ├── document_indexer.py
│   │   │   └── installer_indexer.py
│   │   └── search_service.py
│   │
│   ├── activity/                      # Activity Logging
│   │   ├── __init__.py
│   │   ├── activity_logger.py
│   │   └── activity_types.py
│   │
│   └── storage/                       # File Storage
│       ├── __init__.py
│       ├── base_storage.py
│       ├── s3_provider.py
│       └── local_provider.py
│
├── models/                            # Database Models (SQLAlchemy)
│   ├── __init__.py
│   ├── base.py                        # SQLAlchemy Base
│   ├── dossier.py
│   ├── document.py
│   ├── user.py
│   ├── installer.py
│   ├── process.py
│   ├── rule.py
│   ├── feedback.py
│   └── activity.py
│
├── schemas/                           # Pydantic Schemas
│   ├── __init__.py
│   ├── dossier.py
│   ├── document.py
│   ├── validation.py
│   ├── ai.py
│   ├── feedback.py
│   └── activity.py
│
├── config/                            # Configuration
│   ├── __init__.py
│   ├── settings.py                    # Pydantic Settings
│   ├── database.py
│   ├── ai.py
│   ├── typesense.py
│   └── storage.py
│
└── tests/                             # Tests (pytest)
    ├── conftest.py
    ├── steps/
    ├── services/
    └── integration/
```


---

## API Endpoints Specification

### Authentication & Authorization

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/auth/login` | User login | No | All |
| POST | `/api/auth/logout` | User logout | Yes | All |
| POST | `/api/auth/refresh` | Refresh access token | Yes | All |
| POST | `/api/auth/forgot-password` | Request password reset | No | All |
| POST | `/api/auth/reset-password` | Reset password with token | No | All |
| GET | `/api/auth/me` | Get current user profile | Yes | All |

### Dossier Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/dossiers` | Create new dossier | Yes | Admin, Installer |
| GET | `/api/dossiers` | List dossiers (with filters) | Yes | All |
| GET | `/api/dossiers/:id` | Get dossier details | Yes | All |
| PATCH | `/api/dossiers/:id` | Update dossier | Yes | Admin, Validator |
| DELETE | `/api/dossiers/:id` | Delete dossier | Yes | Admin |
| POST | `/api/dossiers/:id/assign` | Assign validator | Yes | Admin |
| POST | `/api/dossiers/:id/priority` | Update priority | Yes | Admin, Validator |
| GET | `/api/dossiers/:id/timeline` | Get dossier timeline | Yes | All |
| GET | `/api/dossiers/:id/activity` | Get dossier activity log | Yes | Admin, Validator |

### Document Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/dossiers/:id/documents` | Upload document(s) | Yes | Admin, Installer |
| GET | `/api/dossiers/:id/documents` | List dossier documents | Yes | All |
| GET | `/api/documents/:id` | Get document details | Yes | All |
| GET | `/api/documents/:id/download` | Download document file | Yes | All |
| GET | `/api/documents/:id/preview` | Get document preview URL | Yes | All |
| POST | `/api/documents/:id/reprocess` | Reprocess document | Yes | Admin, Validator |
| DELETE | `/api/documents/:id` | Delete document | Yes | Admin |

### Validation Operations

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/dossiers/:id/validation` | Get validation state | Yes | Validator, Admin |
| GET | `/api/dossiers/:id/fields` | Get extracted fields | Yes | Validator, Admin |
| PATCH | `/api/dossiers/:id/fields/:fieldId` | Update field value | Yes | Validator |
| POST | `/api/dossiers/:id/fields/:fieldId/confirm` | Confirm field | Yes | Validator |
| POST | `/api/dossiers/:id/fields/:fieldId/mark-wrong` | Mark field as wrong | Yes | Validator |
| GET | `/api/dossiers/:id/rules` | Get validation rules results | Yes | Validator, Admin |
| POST | `/api/dossiers/:id/rules/:ruleId/override` | Override rule | Yes | Validator |
| POST | `/api/dossiers/:id/validate` | Run validation | Yes | Validator, Admin |
| POST | `/api/dossiers/:id/approve` | Approve dossier | Yes | Validator |
| POST | `/api/dossiers/:id/reject` | Reject dossier | Yes | Validator |
| POST | `/api/dossiers/:id/save-progress` | Save validation progress | Yes | Validator |

### Human Feedback & Training

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/feedback` | Submit correction feedback | Yes | Validator |
| GET | `/api/feedback` | List feedback entries | Yes | Admin |
| GET | `/api/feedback/:id` | Get feedback details | Yes | Admin |
| GET | `/api/feedback/stats` | Get feedback statistics | Yes | Admin |
| POST | `/api/feedback/export` | Export training dataset | Yes | Admin |
| GET | `/api/feedback/model-performance` | Get model performance metrics | Yes | Admin |

### Process Configuration

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/processes` | Create CEE process | Yes | Admin |
| GET | `/api/processes` | List processes | Yes | All |
| GET | `/api/processes/:id` | Get process details | Yes | All |
| PATCH | `/api/processes/:id` | Update process | Yes | Admin |
| POST | `/api/processes/:id/clone` | Clone process | Yes | Admin |
| POST | `/api/processes/:id/activate` | Activate process | Yes | Admin |
| POST | `/api/processes/:id/deactivate` | Deactivate process | Yes | Admin |
| GET | `/api/processes/:id/versions` | Get process versions | Yes | Admin |

### Document Type Configuration

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/document-types` | Create document type | Yes | Admin |
| GET | `/api/document-types` | List document types | Yes | All |
| GET | `/api/document-types/:id` | Get document type details | Yes | All |
| PATCH | `/api/document-types/:id` | Update document type | Yes | Admin |
| DELETE | `/api/document-types/:id` | Delete document type | Yes | Admin |

### Validation Rules Configuration

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/rules` | Create validation rule | Yes | Admin |
| GET | `/api/rules` | List rules (with filters) | Yes | Admin |
| GET | `/api/rules/:id` | Get rule details | Yes | Admin |
| PATCH | `/api/rules/:id` | Update rule | Yes | Admin |
| DELETE | `/api/rules/:id` | Delete rule | Yes | Admin |
| POST | `/api/rules/:id/test` | Test rule with sample data | Yes | Admin |
| POST | `/api/rules/:id/toggle` | Enable/disable rule | Yes | Admin |
| GET | `/api/rules/:id/versions` | Get rule versions | Yes | Admin |

### Field Schema Configuration

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/schemas` | Create field schema | Yes | Admin |
| GET | `/api/schemas` | List schemas | Yes | Admin |
| GET | `/api/schemas/:id` | Get schema details | Yes | Admin |
| PATCH | `/api/schemas/:id` | Update schema | Yes | Admin |
| DELETE | `/api/schemas/:id` | Delete schema | Yes | Admin |
| GET | `/api/schemas/:id/fields` | Get schema fields | Yes | Admin |

### User Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/users` | Create user | Yes | Admin |
| GET | `/api/users` | List users | Yes | Admin |
| GET | `/api/users/:id` | Get user details | Yes | Admin |
| PATCH | `/api/users/:id` | Update user | Yes | Admin |
| POST | `/api/users/:id/deactivate` | Deactivate user | Yes | Admin |
| POST | `/api/users/:id/activate` | Activate user | Yes | Admin |
| POST | `/api/users/:id/reset-password` | Admin reset password | Yes | Admin |

### Installer Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/installers` | Create installer | Yes | Admin |
| GET | `/api/installers` | List installers | Yes | Admin |
| GET | `/api/installers/:id` | Get installer details | Yes | Admin |
| PATCH | `/api/installers/:id` | Update installer | Yes | Admin |
| POST | `/api/installers/:id/verify-rge` | Verify RGE status | Yes | Admin |
| GET | `/api/installers/:id/dossiers` | Get installer dossiers | Yes | Admin, Installer |
| GET | `/api/installers/:id/stats` | Get installer statistics | Yes | Admin |

### Billing Operations

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/billing/summary` | Get billing summary | Yes | Admin |
| GET | `/api/billing/dossiers` | List billable dossiers | Yes | Admin |
| POST | `/api/billing/dossiers/:id/invoice` | Generate invoice | Yes | Admin |
| POST | `/api/billing/dossiers/:id/payment` | Record payment | Yes | Admin |
| GET | `/api/billing/invoices` | List invoices | Yes | Admin |
| GET | `/api/billing/invoices/:id` | Get invoice details | Yes | Admin |
| GET | `/api/billing/invoices/:id/download` | Download invoice PDF | Yes | Admin |
| POST | `/api/billing/export` | Export billing data | Yes | Admin |

### Analytics & Reporting

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/analytics/dashboard` | Get dashboard metrics | Yes | Admin, Validator |
| GET | `/api/analytics/validation` | Get validation statistics | Yes | Admin |
| GET | `/api/analytics/processing` | Get processing metrics | Yes | Admin |
| GET | `/api/analytics/model-performance` | Get AI model metrics | Yes | Admin |
| GET | `/api/analytics/validators` | Get validator performance | Yes | Admin |
| GET | `/api/analytics/installers` | Get installer statistics | Yes | Admin |
| POST | `/api/analytics/export` | Export analytics report | Yes | Admin |

### Activity Logging

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/activity` | List activity logs | Yes | Admin |
| GET | `/api/activity/:id` | Get activity details | Yes | Admin |
| GET | `/api/activity/export` | Export activity logs | Yes | Admin |

### Search (Typesense)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/search` | Global search | Yes | All |
| GET | `/api/search/dossiers` | Search dossiers | Yes | All |
| GET | `/api/search/documents` | Search documents | Yes | All |
| GET | `/api/search/installers` | Search installers | Yes | Admin |
| GET | `/api/search/suggestions` | Get search suggestions | Yes | All |

### AI Configuration

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/ai/config` | Get AI configuration | Yes | Admin |
| PATCH | `/api/ai/config` | Update AI configuration | Yes | Admin |
| GET | `/api/ai/providers` | List available providers | Yes | Admin |
| POST | `/api/ai/providers/:id/test` | Test provider connection | Yes | Admin |
| GET | `/api/ai/models` | List available models | Yes | Admin |
| POST | `/api/ai/models/:id/benchmark` | Run model benchmark | Yes | Admin |

### Installer Portal (Self-Service)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/portal/dossiers` | List my dossiers | Yes | Installer |
| GET | `/api/portal/dossiers/:id` | Get my dossier details | Yes | Installer |
| POST | `/api/portal/dossiers` | Submit new dossier | Yes | Installer |
| POST | `/api/portal/dossiers/:id/documents` | Upload documents | Yes | Installer |
| GET | `/api/portal/payments` | List my payments | Yes | Installer |
| GET | `/api/portal/profile` | Get my profile | Yes | Installer |
| PATCH | `/api/portal/profile` | Update my profile | Yes | Installer |

### Bulk Upload (Simplified Installer Flow)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/portal/bulk-upload` | Bulk upload documents with auto process detection | Yes | Installer |
| GET | `/api/portal/bulk-upload/:dossierId/status` | Get bulk upload processing status | Yes | Installer |
| POST | `/api/portal/bulk-upload/:dossierId/add-documents` | Add documents to existing dossier | Yes | Installer |
| POST | `/api/processes/detect` | Detect CEE processes from documents (preview) | Yes | Installer, Admin |
| POST | `/api/documents/:id/split` | Split multi-page PDF into individual documents | Yes | Admin, System |

#### Bulk Upload Flow Description

The bulk upload flow simplifies document submission for installers:

1. **Upload**: Installer uploads one or more files (including multi-page PDFs)
2. **Immediate Response**: System accepts files and returns dossier ID immediately
3. **Background Processing**:
   - Split multi-page PDFs into individual documents
   - Classify each document (devis, facture, attestation, etc.)
   - Detect CEE process codes from Attestation sur l'honneur
   - Validate document completeness per process requirements
4. **Notification**: Email installer about missing documents or successful submission


---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │   installers    │       │    processes    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ email           │       │ company_name    │       │ code            │
│ password_hash   │       │ siret           │       │ name            │
│ name            │       │ siren           │       │ category        │
│ role            │       │ address         │       │ description     │
│ active          │       │ city            │       │ version         │
│ last_login      │       │ postal_code     │       │ is_active       │
│ created_at      │       │ contact_name    │       │ is_coup_de_pouce│
│ updated_at      │       │ contact_email   │       │ valid_from      │
└────────┬────────┘       │ contact_phone   │       │ valid_until     │
         │                │ rge_number      │       │ created_at      │
         │                │ rge_valid_until │       │ updated_at      │
         │                │ rge_status      │       └────────┬────────┘
         │                │ qualifications  │                │
         │                │ active          │                │
         │                │ created_at      │                │
         │                └────────┬────────┘                │
         │                         │                         │
         │    ┌────────────────────┼─────────────────────────┘
         │    │                    │
         ▼    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              dossiers                                │
├─────────────────────────────────────────────────────────────────────┤
│ id                    │ reference              │ status              │
│ process_id (FK)       │ installer_id (FK)      │ priority            │
│ assigned_validator_id │ beneficiary_name       │ beneficiary_address │
│ beneficiary_city      │ beneficiary_postal_code│ beneficiary_email   │
│ beneficiary_phone     │ precarity_status       │ confidence_score    │
│ cumac_value           │ submitted_at           │ validated_at        │
│ validated_by          │ processing_time_ms     │ created_at          │
│ updated_at            │                        │                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────────────────────┐
         │ 1:N                                                         │ 1:N
         ▼                                                             ▼
┌─────────────────────────────────────────┐   ┌───────────────────────────────────┐
│           dossier_processes              │   │         project_timelines         │
├─────────────────────────────────────────┤   ├───────────────────────────────────┤
│ id                  │ dossier_id (FK)   │   │ id              │ dossier_id (FK) │
│ process_id (FK)     │ process_code      │   │ dossier_process_id (FK)           │
│ process_name        │ status            │   │ devis_date      │ signature_date  │
│ confidence_score    │ cumac_value       │   │ works_start_date│ works_end_date  │
│ processing_time_ms  │ validated_at      │   │ invoice_date    │ created_at      │
│ validated_by        │ created_at        │   │ updated_at      │                 │
│ updated_at          │                   │   └───────────────────────────────────┘
└─────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              documents                               │
├─────────────────────────────────────────────────────────────────────┤
│ id                    │ dossier_id (FK)        │ document_type_id    │
│ dossier_process_id    │ filename               │ storage_path        │
│ mime_type             │ file_size              │ page_count          │
│ processing_status     │ classification_confidence│ uploaded_at       │
│ processed_at          │ created_at             │ updated_at          │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          extracted_fields                            │
├─────────────────────────────────────────────────────────────────────┤
│ id                    │ document_id (FK)       │ field_schema_id     │
│ field_name            │ display_name           │ extracted_value     │
│ confidence            │ status                 │ original_value      │
│ corrected_value       │ bounding_box           │ page_number         │
│ extraction_method     │ marked_wrong_at        │ marked_wrong_by     │
│ created_at            │ updated_at             │                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('administrator', 'validator', 'installer')),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Installers table
CREATE TABLE installers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    siret VARCHAR(14) NOT NULL UNIQUE,
    siren VARCHAR(9) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    rge_number VARCHAR(50),
    rge_valid_until DATE,
    rge_status VARCHAR(20) DEFAULT 'not_verified',
    qualifications JSONB DEFAULT '[]',
    contract_reference VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CEE Processes table
CREATE TABLE processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_coup_de_pouce BOOLEAN DEFAULT false,
    valid_from DATE NOT NULL,
    valid_until DATE,
    required_documents JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Types table
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    extraction_schema_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dossiers table
CREATE TABLE dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    process_id UUID REFERENCES processes(id) NOT NULL,
    installer_id UUID REFERENCES installers(id) NOT NULL,
    assigned_validator_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'normal',
    beneficiary_name VARCHAR(255) NOT NULL,
    beneficiary_address TEXT NOT NULL,
    beneficiary_city VARCHAR(255) NOT NULL,
    beneficiary_postal_code VARCHAR(10) NOT NULL,
    beneficiary_email VARCHAR(255),
    beneficiary_phone VARCHAR(20),
    precarity_status VARCHAR(50),
    confidence_score DECIMAL(5,4),
    cumac_value DECIMAL(12,2),              -- kWh cumac (energy savings value)
    submitted_at TIMESTAMP,
    validated_at TIMESTAMP,
    validated_by UUID REFERENCES users(id),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Timeline table (milestones for each dossier)
CREATE TABLE project_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE NOT NULL,
    dossier_process_id UUID,                 -- Optional FK to specific process
    devis_date DATE,                         -- Quote/estimate date
    signature_date DATE,                     -- Contract signing date
    works_start_date DATE,                   -- Works start date
    works_end_date DATE,                     -- Works completion date
    invoice_date DATE,                       -- Invoice date
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dossier_id, dossier_process_id)
);

-- Dossier Processes table (supports multiple CEE processes per dossier)
CREATE TABLE dossier_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE NOT NULL,
    process_id UUID REFERENCES processes(id) NOT NULL,
    process_code VARCHAR(50) NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    confidence_score DECIMAL(5,4),
    cumac_value DECIMAL(12,2),               -- kWh cumac for this specific process
    processing_time_ms INTEGER,
    validated_at TIMESTAMP,
    validated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


### Additional Tables

```sql
-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE NOT NULL,
    document_type_id UUID REFERENCES document_types(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INTEGER,
    processing_status VARCHAR(50) DEFAULT 'pending',
    classification_confidence DECIMAL(5,4),
    ocr_text TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extracted Fields table
CREATE TABLE extracted_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE NOT NULL,
    field_schema_id UUID,
    field_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    extracted_value JSONB,
    data_type VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4),
    status VARCHAR(50) DEFAULT 'unreviewed',
    original_value JSONB,
    corrected_value JSONB,
    bounding_box JSONB,
    page_number INTEGER,
    extraction_method VARCHAR(50),
    marked_wrong_at TIMESTAMP,
    marked_wrong_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    confirmed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Validation Rules table
CREATE TABLE validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    process_id UUID REFERENCES processes(id),
    document_type_id UUID REFERENCES document_types(id),
    rule_type VARCHAR(50) NOT NULL, -- 'document', 'cross_document', 'business'
    severity VARCHAR(20) NOT NULL DEFAULT 'error',
    expression TEXT NOT NULL,
    error_message TEXT NOT NULL,
    can_override BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Validation Results table
CREATE TABLE validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE NOT NULL,
    rule_id UUID REFERENCES validation_rules(id) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'passed', 'warning', 'error'
    message TEXT,
    affected_fields JSONB DEFAULT '[]',
    overridden BOOLEAN DEFAULT false,
    override_reason TEXT,
    overridden_by UUID REFERENCES users(id),
    overridden_at TIMESTAMP,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Field Schemas table
CREATE TABLE field_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type_id UUID REFERENCES document_types(id) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    validation_pattern VARCHAR(255),
    extraction_hints JSONB,
    default_value JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_type_id, field_name)
);

-- Human Feedback table (for training improvement)
CREATE TABLE human_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id),
    document_id UUID REFERENCES documents(id),
    extracted_field_id UUID REFERENCES extracted_fields(id),
    feedback_type VARCHAR(50) NOT NULL, -- 'field_correction', 'classification_error', 'extraction_error'
    original_value JSONB,
    corrected_value JSONB,
    field_name VARCHAR(100),
    document_type VARCHAR(100),
    context_data JSONB, -- surrounding text, image region, etc.
    model_used VARCHAR(100),
    model_version VARCHAR(50),
    confidence_before DECIMAL(5,4),
    validator_id UUID REFERENCES users(id) NOT NULL,
    notes TEXT,
    used_for_training BOOLEAN DEFAULT false,
    training_batch_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_reference VARCHAR(100),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing/Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES dossiers(id) NOT NULL,
    installer_id UUID REFERENCES installers(id) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    kwh_cumac DECIMAL(12,2),
    price_per_kwh DECIMAL(8,6),
    total_amount DECIMAL(12,2) NOT NULL,
    payment_on_validation DECIMAL(12,2),
    payment_on_emmy DECIMAL(12,2),
    due_date DATE,
    paid_at TIMESTAMP,
    payment_reference VARCHAR(100),
    payment_method VARCHAR(50),
    pdf_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Configuration table
CREATE TABLE ai_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    parameters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model Performance Metrics table
CREATE TABLE model_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    task_type VARCHAR(50) NOT NULL, -- 'classification', 'extraction', 'ocr'
    metric_name VARCHAR(50) NOT NULL, -- 'accuracy', 'precision', 'recall', 'f1'
    metric_value DECIMAL(8,6) NOT NULL,
    sample_size INTEGER,
    evaluation_date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_installer ON dossiers(installer_id);
CREATE INDEX idx_dossiers_validator ON dossiers(assigned_validator_id);
CREATE INDEX idx_dossiers_submitted ON dossiers(submitted_at);
CREATE INDEX idx_dossier_processes_dossier ON dossier_processes(dossier_id);
CREATE INDEX idx_dossier_processes_status ON dossier_processes(status);
CREATE INDEX idx_dossier_processes_code ON dossier_processes(process_code);
CREATE INDEX idx_project_timelines_dossier ON project_timelines(dossier_id);
CREATE INDEX idx_documents_dossier ON documents(dossier_id);
CREATE INDEX idx_documents_status ON documents(processing_status);
CREATE INDEX idx_extracted_fields_dossier ON extracted_fields(dossier_id);
CREATE INDEX idx_extracted_fields_status ON extracted_fields(status);
CREATE INDEX idx_validation_results_dossier ON validation_results(dossier_id);
CREATE INDEX idx_human_feedback_created ON human_feedback(created_at);
CREATE INDEX idx_human_feedback_training ON human_feedback(used_for_training);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
```


---

## AI Model Abstraction Layer

### Architecture Overview

The AI abstraction layer provides a plug-and-play architecture for swapping AI models with minimal code changes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI ABSTRACTION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        AI Provider Factory                           │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  getProvider(task: string): AIProvider                       │    │    │
│  │  │  - Reads configuration from database                         │    │    │
│  │  │  - Returns appropriate provider instance                     │    │    │
│  │  │  - Handles fallback providers                                │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Provider Interface                              │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  interface AIProvider {                                      │    │    │
│  │  │    classify(document: Buffer): Promise<Classification>       │    │    │
│  │  │    extractFields(document: Buffer, schema: Schema): Fields   │    │    │
│  │  │    extractText(document: Buffer): Promise<string>            │    │    │
│  │  │    detectSignatures(image: Buffer): Promise<Signature[]>     │    │    │
│  │  │    chat(messages: Message[]): Promise<Response>              │    │    │
│  │  │  }                                                           │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│         ┌─────────────────────────────┼─────────────────────────────┐       │
│         ▼                             ▼                             ▼       │
│  ┌─────────────┐             ┌─────────────┐             ┌─────────────┐    │
│  │   OpenAI    │             │  Anthropic  │             │   Mistral   │    │
│  │  Provider   │             │  Provider   │             │  Provider   │    │
│  ├─────────────┤             ├─────────────┤             ├─────────────┤    │
│  │ GPT-4o      │             │ Claude 3.5  │             │ Mistral     │    │
│  │ GPT-4-vision│             │ Claude 3    │             │ Large       │    │
│  └─────────────┘             └─────────────┘             └─────────────┘    │
│         │                             │                             │       │
│         └─────────────────────────────┼─────────────────────────────┘       │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Local/Self-Hosted Providers                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │   Ollama    │  │   vLLM      │  │  Docling    │  │ PaddleOCR  │  │    │
│  │  │  (LLaMA)    │  │  (Custom)   │  │   (OCR)     │  │   (OCR)    │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Provider Interface (Python)

```python
# services/ai/base_provider.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional
from pydantic import BaseModel


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class ClassificationResult(BaseModel):
    document_type: str
    confidence: float
    alternatives: list[dict[str, Any]]  # [{"type": str, "confidence": float}]


class ExtractedField(BaseModel):
    field_name: str
    value: Any
    confidence: float
    bounding_box: Optional[BoundingBox] = None
    page_number: Optional[int] = None


class ExtractionResult(BaseModel):
    fields: list[ExtractedField]
    raw_text: Optional[str] = None
    processing_time: float


class SignatureDetection(BaseModel):
    detected: bool
    confidence: float
    location: Optional[BoundingBox] = None
    page_number: Optional[int] = None


@dataclass
class AIProviderConfig:
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
```

### Provider Factory (Python)

```python
# services/ai/provider_factory.py

from enum import Enum
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from .base_provider import AIProvider, AIProviderConfig
from .providers.openai_provider import OpenAIProvider
from .providers.anthropic_provider import AnthropicProvider
from .providers.mistral_provider import MistralProvider
from .providers.local_provider import LocalProvider
from models.ai_configuration import AIConfiguration
from services.encryption import decrypt_api_key


class AITask(str, Enum):
    CLASSIFICATION = "classification"
    EXTRACTION = "extraction"
    OCR = "ocr"
    SIGNATURE_DETECTION = "signature_detection"
    VISION_ANALYSIS = "vision_analysis"


class AIProviderFactory:
    """Factory for creating AI provider instances."""

    _providers: dict[str, AIProvider] = {}

    @classmethod
    async def get_provider(
        cls,
        task: AITask,
        db: AsyncSession
    ) -> AIProvider:
        """Get AI provider for a specific task."""

        # Query configuration from database
        config = await db.execute(
            select(AIConfiguration)
            .where(AIConfiguration.config_key == task.value)
            .where(AIConfiguration.is_active == True)
            .order_by(AIConfiguration.priority.desc())
            .limit(1)
        )
        config = config.scalar_one_or_none()

        if not config:
            raise ValueError(f"No AI provider configured for task: {task}")

        cache_key = f"{config.provider}-{config.model_name}"

        if cache_key in cls._providers:
            return cls._providers[cache_key]

        provider = cls._create_provider(config)
        cls._providers[cache_key] = provider

        return provider

    @classmethod
    def _create_provider(cls, config: AIConfiguration) -> AIProvider:
        """Create provider instance based on configuration."""

        provider_config = AIProviderConfig(
            api_key=decrypt_api_key(config.api_key_encrypted),
            api_endpoint=config.api_endpoint,
            model=config.model_name,
            parameters=config.parameters
        )

        providers = {
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
            "mistral": MistralProvider,
            "local": LocalProvider,
            "ollama": LocalProvider,
            "vllm": LocalProvider,
        }

        provider_class = providers.get(config.provider)
        if not provider_class:
            raise ValueError(f"Unknown provider: {config.provider}")

        return provider_class(provider_config)
```

### Example Provider Implementation (OpenAI)

```python
# services/ai/providers/openai_provider.py

import openai
from typing import Optional

from ..base_provider import (
    AIProvider, AIProviderConfig, ClassificationResult,
    ExtractionResult, ExtractedField, SignatureDetection
)


class OpenAIProvider(AIProvider):
    """OpenAI API provider implementation."""

    def __init__(self, config: AIProviderConfig):
        super().__init__(config)
        self.client = openai.AsyncOpenAI(api_key=config.api_key)

    @property
    def name(self) -> str:
        return "openai"

    @property
    def version(self) -> str:
        return "1.0.0"

    async def classify_document(
        self,
        document: bytes,
        mime_type: str,
        possible_types: Optional[list[str]] = None
    ) -> ClassificationResult:
        """Classify document using GPT-4 Vision."""

        import base64
        doc_b64 = base64.b64encode(document).decode()

        types_hint = ""
        if possible_types:
            types_hint = f"Possible types: {', '.join(possible_types)}"

        response = await self.client.chat.completions.create(
            model=self.config.model or "gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Classify this CEE document. {types_hint}"},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{doc_b64}"}}
                ]
            }],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return ClassificationResult(**result)

    async def health_check(self) -> bool:
        """Check OpenAI API availability."""
        try:
            await self.client.models.list()
            return True
        except Exception:
            return False
```


---

## Evaluation-Driven Improvement System

### Overview

The evaluation-driven improvement system captures human validator feedback when AI output is marked incorrect, creating a continuous feedback loop for model improvement.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVALUATION-DRIVEN IMPROVEMENT SYSTEM                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     1. FEEDBACK CAPTURE                              │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Validator marks field as "Wrong"                           │    │    │
│  │  │  ↓                                                          │    │    │
│  │  │  System captures:                                           │    │    │
│  │  │  • Original AI-extracted value                              │    │    │
│  │  │  • Corrected value from validator                           │    │    │
│  │  │  • Document context (surrounding text, image region)        │    │    │
│  │  │  • Model used and version                                   │    │    │
│  │  │  • Confidence score before correction                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     2. FEEDBACK STORAGE                              │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  human_feedback table stores:                               │    │    │
│  │  │  • feedback_type: 'field_correction' | 'classification'    │    │    │
│  │  │  • original_value, corrected_value                          │    │    │
│  │  │  • context_data (JSON with surrounding text, bbox, etc.)    │    │    │
│  │  │  • model_used, model_version                                │    │    │
│  │  │  • used_for_training: boolean                               │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  3. TRAINING DATASET GENERATION                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Export validated corrections as training data:             │    │    │
│  │  │  • Filter by feedback_type, date range, field_name          │    │    │
│  │  │  • Generate JSONL format for fine-tuning                    │    │    │
│  │  │  • Include document images/text as context                  │    │    │
│  │  │  • Mark records as used_for_training = true                 │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    4. MODEL EVALUATION                               │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Track model performance over time:                         │    │    │
│  │  │  • Accuracy per field type                                  │    │    │
│  │  │  • Precision/Recall for classification                      │    │    │
│  │  │  • Correction rate trends                                   │    │    │
│  │  │  • Compare model versions                                   │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### MOTIA Event Flow for Feedback (Python)

```python
# steps/events/feedback/process_correction.step.py

config = {
    "type": "event",
    "name": "ProcessCorrection",
    "subscribes": ["field.marked_wrong"],
    "emits": ["feedback.stored", "training.dataset.updated"],
    "flows": ["FeedbackLoop"]
}


async def handler(event, ctx):
    """Process field correction feedback from validators."""

    data = event["data"]
    dossier_id = data["dossier_id"]
    document_id = data["document_id"]
    field_id = data["field_id"]
    original_value = data["original_value"]
    corrected_value = data["corrected_value"]
    validator_id = data["validator_id"]
    model_used = data["model_used"]
    model_version = data["model_version"]
    confidence = data["confidence"]

    ctx.logger.info("Processing field correction", {
        "field_id": field_id,
        "dossier_id": dossier_id
    })

    # Get document context for training using MOTIA state
    document = await ctx.state.get(ctx.trace_id, f"document:{document_id}")
    context_data = await extract_context(document, field_id)

    # Store feedback in database
    async with get_db_session() as db:
        feedback = HumanFeedback(
            dossier_id=dossier_id,
            document_id=document_id,
            extracted_field_id=field_id,
            feedback_type="field_correction",
            original_value=original_value,
            corrected_value=corrected_value,
            context_data=context_data,
            model_used=model_used,
            model_version=model_version,
            confidence_before=confidence,
            validator_id=validator_id
        )
        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)

    await ctx.emit({
        "topic": "feedback.stored",
        "data": {"feedback_id": str(feedback.id), "field_id": field_id, "dossier_id": dossier_id}
    })

    # Check if we have enough new corrections to trigger dataset update
    async with get_db_session() as db:
        result = await db.execute(
            select(func.count(HumanFeedback.id))
            .where(HumanFeedback.used_for_training == False)
        )
        pending_count = result.scalar()

    if pending_count >= 100:  # Configurable threshold
        await ctx.emit({
            "topic": "training.dataset.updated",
            "data": {"pending_count": pending_count}
        })
```

### Training Dataset Export (Python)

```python
# services/feedback/training_dataset_generator.py

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional
from pathlib import Path
import json

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.feedback import HumanFeedback
from models.document import Document


class TrainingInput(BaseModel):
    document_text: str
    field_name: str
    document_type: str
    context: str


class TrainingOutput(BaseModel):
    value: Any
    confidence: float


class TrainingMetadata(BaseModel):
    feedback_id: str
    validator_id: str
    created_at: datetime


class TrainingExample(BaseModel):
    input: TrainingInput
    output: TrainingOutput
    metadata: TrainingMetadata


class TrainingDatasetGenerator:
    """Generate training datasets from human feedback."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_dataset(
        self,
        feedback_type: Optional[str] = None,
        field_name: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> list[TrainingExample]:
        """Generate training examples from unused feedback."""

        query = (
            select(HumanFeedback)
            .where(HumanFeedback.used_for_training == False)
        )

        if feedback_type:
            query = query.where(HumanFeedback.feedback_type == feedback_type)
        if field_name:
            query = query.where(HumanFeedback.field_name == field_name)
        if date_from:
            query = query.where(HumanFeedback.created_at >= date_from)
        if date_to:
            query = query.where(HumanFeedback.created_at <= date_to)
        if limit:
            query = query.limit(limit)

        result = await self.db.execute(query)
        feedback_records = result.scalars().all()

        examples = [
            TrainingExample(
                input=TrainingInput(
                    document_text=f.context_data.get("surrounding_text", ""),
                    field_name=f.field_name,
                    document_type=f.document_type,
                    context=json.dumps(f.context_data)
                ),
                output=TrainingOutput(
                    value=f.corrected_value,
                    confidence=1.0  # Human-validated
                ),
                metadata=TrainingMetadata(
                    feedback_id=str(f.id),
                    validator_id=str(f.validator_id),
                    created_at=f.created_at
                )
            )
            for f in feedback_records
        ]

        # Mark as used for training
        feedback_ids = [f.id for f in feedback_records]
        batch_id = generate_batch_id()

        await self.db.execute(
            update(HumanFeedback)
            .where(HumanFeedback.id.in_(feedback_ids))
            .values(used_for_training=True, training_batch_id=batch_id)
        )
        await self.db.commit()

        return examples

    async def export_to_jsonl(
        self,
        examples: list[TrainingExample],
        file_path: Path
    ) -> None:
        """Export training examples to JSONL format."""

        lines = [example.model_dump_json() for example in examples]
        file_path.write_text("\n".join(lines))
```


---

## Activity Logging & Analytics

### Activity Types (Python)

```python
# services/activity/activity_types.py

from enum import Enum
from typing import Any, Literal, Optional
from pydantic import BaseModel


class ActivityType(str, Enum):
    # Authentication
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    PASSWORD_RESET = "user.password_reset"

    # Dossier operations
    DOSSIER_CREATED = "dossier.created"
    DOSSIER_UPDATED = "dossier.updated"
    DOSSIER_ASSIGNED = "dossier.assigned"
    DOSSIER_APPROVED = "dossier.approved"
    DOSSIER_REJECTED = "dossier.rejected"
    DOSSIER_DELETED = "dossier.deleted"

    # Document operations
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_PROCESSED = "document.processed"
    DOCUMENT_REPROCESSED = "document.reprocessed"
    DOCUMENT_DELETED = "document.deleted"

    # Validation operations
    FIELD_CONFIRMED = "field.confirmed"
    FIELD_CORRECTED = "field.corrected"
    FIELD_MARKED_WRONG = "field.marked_wrong"
    RULE_OVERRIDDEN = "rule.overridden"
    VALIDATION_STARTED = "validation.started"
    VALIDATION_COMPLETED = "validation.completed"

    # Configuration changes
    PROCESS_CREATED = "process.created"
    PROCESS_UPDATED = "process.updated"
    RULE_CREATED = "rule.created"
    RULE_UPDATED = "rule.updated"
    SCHEMA_UPDATED = "schema.updated"
    AI_CONFIG_UPDATED = "ai_config.updated"

    # Billing
    INVOICE_GENERATED = "invoice.generated"
    PAYMENT_RECORDED = "payment.recorded"

    # System
    SYSTEM_ERROR = "system.error"
    MODEL_EVALUATION = "model.evaluation"


EntityType = Literal["dossier", "document", "user", "installer", "process", "rule", "invoice"]


class ActivityLogEntry(BaseModel):
    user_id: Optional[str] = None
    action_type: ActivityType
    entity_type: EntityType
    entity_id: Optional[str] = None
    entity_reference: Optional[str] = None
    description: str
    metadata: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    duration_ms: Optional[int] = None
```

### Activity Logger Service (Python)

```python
# services/activity/activity_logger.py

from datetime import datetime
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .activity_types import ActivityLogEntry, ActivityType
from models.activity import ActivityLog


class ActivityLogger:
    """Service for logging and querying activity logs."""

    def __init__(self, db: AsyncSession, event_emitter=None):
        self.db = db
        self.event_emitter = event_emitter

    async def log(self, entry: ActivityLogEntry) -> None:
        """Log an activity entry."""

        activity = ActivityLog(
            user_id=entry.user_id,
            action_type=entry.action_type.value,
            entity_type=entry.entity_type,
            entity_id=entry.entity_id,
            entity_reference=entry.entity_reference,
            description=entry.description,
            metadata=entry.metadata or {},
            ip_address=entry.ip_address,
            user_agent=entry.user_agent,
            duration_ms=entry.duration_ms
        )

        self.db.add(activity)
        await self.db.commit()

        # Emit event for real-time dashboards
        if self.event_emitter:
            await self.event_emitter.emit("activity.logged", entry.model_dump())

    async def get_activities(
        self,
        user_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        action_types: Optional[list[ActivityType]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0
    ) -> dict:
        """Query activity logs with filters."""

        query = select(ActivityLog)
        count_query = select(func.count(ActivityLog.id))

        if user_id:
            query = query.where(ActivityLog.user_id == user_id)
            count_query = count_query.where(ActivityLog.user_id == user_id)
        if entity_type:
            query = query.where(ActivityLog.entity_type == entity_type)
            count_query = count_query.where(ActivityLog.entity_type == entity_type)
        if entity_id:
            query = query.where(ActivityLog.entity_id == entity_id)
            count_query = count_query.where(ActivityLog.entity_id == entity_id)
        if action_types:
            type_values = [t.value for t in action_types]
            query = query.where(ActivityLog.action_type.in_(type_values))
            count_query = count_query.where(ActivityLog.action_type.in_(type_values))
        if date_from:
            query = query.where(ActivityLog.created_at >= date_from)
            count_query = count_query.where(ActivityLog.created_at >= date_from)
        if date_to:
            query = query.where(ActivityLog.created_at <= date_to)
            count_query = count_query.where(ActivityLog.created_at <= date_to)

        query = query.order_by(ActivityLog.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await self.db.execute(query)
        activities = result.scalars().all()

        count_result = await self.db.execute(count_query)
        total = count_result.scalar()

        return {"activities": activities, "total": total}
```

### Analytics Metrics (Python)

```python
# services/analytics/metrics.py

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.dossier import Dossier
from models.activity import ActivityLog


class DossierMetrics(BaseModel):
    total: int
    by_status: dict[str, int]
    submitted_today: int
    validated_today: int
    avg_processing_time: float


class ValidationMetrics(BaseModel):
    pending_review: int
    avg_confidence: float
    correction_rate: float
    override_rate: float


class PerformanceMetrics(BaseModel):
    avg_validation_time: float
    dossiers_per_validator: dict[str, int]
    model_accuracy: dict[str, float]


class DashboardMetrics(BaseModel):
    dossiers: DossierMetrics
    validation: ValidationMetrics
    performance: PerformanceMetrics


class AnalyticsService:
    """Service for computing analytics metrics."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_metrics(
        self,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> DashboardMetrics:
        """Get all dashboard metrics."""

        dossier_stats = await self._get_dossier_stats(date_from, date_to)
        validation_stats = await self._get_validation_stats(date_from, date_to)
        performance_stats = await self._get_performance_stats(date_from, date_to)

        return DashboardMetrics(
            dossiers=dossier_stats,
            validation=validation_stats,
            performance=performance_stats
        )
```


---

## Search Infrastructure (Typesense)

### Typesense Integration (Python)

```python
# services/search/typesense_client.py

import typesense
from config.settings import settings


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
```

### Search Service (Python)

```python
# services/search/search_service.py

from typing import Any, Optional
from pydantic import BaseModel

from .typesense_client import get_typesense_client


class SearchResult(BaseModel):
    hits: list[dict[str, Any]]
    total: int
    page: int
    total_pages: int


class GlobalSearchResult(BaseModel):
    dossiers: SearchResult
    documents: SearchResult
    installers: SearchResult


class SearchService:
    """Service for Typesense search operations."""

    def __init__(self):
        self.client = get_typesense_client()

    async def search_dossiers(
        self,
        query: str,
        filters: Optional[dict[str, str]] = None,
        page: int = 1,
        per_page: int = 20
    ) -> SearchResult:
        """Search dossiers collection."""

        filter_by = self._build_filter_string(filters) if filters else ""

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

    async def global_search(self, query: str) -> GlobalSearchResult:
        """Search across all collections."""

        dossiers = await self.search_dossiers(query, per_page=5)
        documents = await self.search_documents(query, per_page=5)
        installers = await self.search_installers(query, per_page=5)

        return GlobalSearchResult(
            dossiers=dossiers,
            documents=documents,
            installers=installers
        )

    def _build_filter_string(self, filters: dict[str, str]) -> str:
        """Build Typesense filter string from dict."""
        parts = [f"{k}:={v}" for k, v in filters.items()]
        return " && ".join(parts)
```

### Indexer (Cron Step - Python)

```python
# steps/cron/sync_typesense_index.step.py

from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models.dossier import Dossier
from services.search.typesense_client import get_typesense_client
from config.database import get_db_session


config = {
    "type": "cron",
    "name": "SyncTypesenseIndex",
    "cron": "*/15 * * * *",  # Every 15 minutes
    "flows": ["Maintenance"]
}


async def handler(ctx):
    """Sync recently updated dossiers to Typesense."""

    ctx.logger.info("Starting Typesense index sync")

    client = get_typesense_client()
    cutoff_time = datetime.utcnow() - timedelta(minutes=15)

    async with get_db_session() as db:
        result = await db.execute(
            select(Dossier)
            .where(Dossier.updated_at >= cutoff_time)
            .options(
                selectinload(Dossier.installer),
                selectinload(Dossier.process)
            )
        )
        updated_dossiers = result.scalars().all()

    for dossier in updated_dossiers:
        client.collections["dossiers"].documents.upsert({
            "id": str(dossier.id),
            "reference": dossier.reference,
            "beneficiary_name": dossier.beneficiary_name,
            "beneficiary_address": dossier.beneficiary_address,
            "beneficiary_city": dossier.beneficiary_city,
            "installer_name": dossier.installer.company_name,
            "process_code": dossier.process.code,
            "process_name": dossier.process.name,
            "status": dossier.status,
            "priority": dossier.priority,
            "confidence_score": dossier.confidence_score or 0.0,
            "submitted_at": int(dossier.submitted_at.timestamp()) if dossier.submitted_at else 0,
            "validated_at": int(dossier.validated_at.timestamp()) if dossier.validated_at else None
        })

    ctx.logger.info(f"Synced {len(updated_dossiers)} dossiers to Typesense")
```


---

## Rule Engine Design

### Rule Expression Language

The rule engine uses a domain-specific expression language for defining validation rules:

```python
# services/rules/rule_parser.py

from dataclasses import dataclass
from typing import Any, Literal, Optional, Union
from pydantic import BaseModel


class RuleExpression(BaseModel):
    type: Literal["comparison", "logical", "function", "field_reference"]
    operator: Optional[str] = None
    left: Optional[Union["RuleExpression", str]] = None
    right: Optional[Union["RuleExpression", Any]] = None
    function: Optional[str] = None
    arguments: Optional[list[Any]] = None
    field: Optional[str] = None
    document: Optional[str] = None


# Example rule expressions:
EXAMPLE_RULES = {
    # Simple field comparison
    "date_check": "devis.date_signature <= facture.date_emission",

    # Cross-document validation
    "amount_match": "ABS(devis.montant_ttc - facture.montant_ttc) < 0.01",

    # Function-based validation
    "siret_valid": "VALIDATE_SIRET(attestation.siret_installateur)",

    # Complex logical expression
    "coup_de_pouce": """
        (beneficiaire.statut_precarite IN ['modeste', 'tres_modeste'])
        AND (devis.date_signature >= '2024-01-01')
        AND (equipement.cop >= 3.5)
    """,

    # Date range validation
    "validity_period": "DAYS_BETWEEN(devis.date_signature, facture.date_emission) <= 365"
}
```

### Rule Evaluator (Python)

```python
# services/rules/rule_evaluator.py

import re
from datetime import datetime, timedelta
from typing import Any, Callable, Optional
from dataclasses import dataclass

from pydantic import BaseModel


@dataclass
class RuleResult:
    rule_id: str
    passed: bool
    status: str  # 'passed', 'warning', 'error'
    message: Optional[str] = None


class RuleEvaluator:
    """Evaluates validation rules against extracted data."""

    def __init__(self):
        self.functions: dict[str, Callable] = {}
        self._register_builtin_functions()

    def _register_builtin_functions(self):
        """Register built-in validation functions."""

        # Date functions
        self.functions["DAYS_BETWEEN"] = lambda d1, d2: abs((d2 - d1).days)
        self.functions["DATE_ADD"] = lambda d, days: d + timedelta(days=days)

        # String functions
        self.functions["CONTAINS"] = lambda s, sub: sub.lower() in s.lower() if s else False
        self.functions["MATCHES"] = lambda s, pattern: bool(re.match(pattern, s)) if s else False

        # Numeric functions
        self.functions["ABS"] = abs
        self.functions["ROUND"] = lambda n, decimals=0: round(n, decimals)

        # CEE-specific functions
        self.functions["VALIDATE_SIRET"] = self._validate_siret
        self.functions["CALCULATE_CEE_PREMIUM"] = self._calculate_cee_premium

    def _validate_siret(self, siret: str) -> bool:
        """Validate French SIRET number using Luhn algorithm."""
        if not siret or len(siret) != 14:
            return False

        total = 0
        for i, char in enumerate(siret):
            if not char.isdigit():
                return False
            digit = int(char)
            if i % 2 == 0:
                digit *= 2
            if digit > 9:
                digit -= 9
            total += digit

        return total % 10 == 0

    def _calculate_cee_premium(
        self,
        operation_code: str,
        climate_zone: str,
        surface: float,
        precarity_status: str
    ) -> float:
        """Calculate CEE premium based on operation parameters."""
        base_kwh_cumac = self._get_base_kwh_cumac(operation_code, climate_zone)
        multiplier = self._get_precarity_multiplier(precarity_status)
        return base_kwh_cumac * surface * multiplier

    async def evaluate(
        self,
        rule: Any,  # ValidationRule model
        context: dict[str, Any]
    ) -> RuleResult:
        """Evaluate a rule against the provided context."""
        try:
            expression = self._parse_expression(rule.expression)
            result = await self._evaluate_expression(expression, context)

            return RuleResult(
                rule_id=str(rule.id),
                passed=bool(result),
                status="passed" if result else ("warning" if rule.severity == "warning" else "error"),
                message=None if result else rule.error_message
            )
        except Exception as e:
            return RuleResult(
                rule_id=str(rule.id),
                passed=False,
                status="error",
                message=f"Rule evaluation error: {str(e)}"
            )
```

### MOTIA Validation Pipeline (Python)

```python
# steps/events/validation/run_document_rules.step.py

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.validation_rule import ValidationRule
from models.validation_result import ValidationResult
from services.rules.rule_evaluator import RuleEvaluator
from config.database import get_db_session


config = {
    "type": "event",
    "name": "RunDocumentRules",
    "subscribes": ["document.extraction.completed"],
    "emits": ["document.validation.completed"],
    "flows": ["ValidationPipeline"]
}


async def handler(event, ctx):
    """Run document-level validation rules."""

    data = event["data"]
    dossier_id = data["dossier_id"]
    document_id = data["document_id"]
    document_type = data["document_type"]

    ctx.logger.info("Running document rules", {
        "dossier_id": dossier_id,
        "document_id": document_id
    })

    # Get applicable rules for this document type
    async with get_db_session() as db:
        result = await db.execute(
            select(ValidationRule)
            .where(ValidationRule.document_type_id == document_type)
            .where(ValidationRule.is_active == True)
            .where(ValidationRule.rule_type == "document")
        )
        rules = result.scalars().all()

    # Get extracted fields from MOTIA state
    fields = await ctx.state.get(ctx.trace_id, f"extracted_fields:{document_id}")

    evaluator = RuleEvaluator()
    results = []

    async with get_db_session() as db:
        for rule in rules:
            rule_result = await evaluator.evaluate(
                rule,
                {"fields": fields, "documents": {}}
            )
            results.append(rule_result)

            # Store result in database
            validation_result = ValidationResult(
                dossier_id=dossier_id,
                rule_id=rule.id,
                status=rule_result.status,
                message=rule_result.message
            )
            db.add(validation_result)

        await db.commit()

    await ctx.emit({
        "topic": "document.validation.completed",
        "data": {
            "dossier_id": dossier_id,
            "document_id": document_id,
            "results": [r.__dict__ for r in results]
        }
    })
```


---

## State Management & Caching

MOTIA provides **built-in state management** that eliminates the need for a separate caching layer in most cases. The state system supports multiple storage adapters.

### State Adapters

| Adapter | Use Case | Configuration |
|---------|----------|---------------|
| **Memory** | Development, testing | Default, zero configuration |
| **File** | Local persistence | Stores in `.motia/motia.state.json` |
| **Redis** | Production, distributed | Recommended for multi-instance deployments |

### MOTIA State Configuration

```yaml
# motia.config.yaml

state:
  adapter: redis  # memory | file | redis
  redis:
    url: ${REDIS_URL}
    ttl: 3600  # Default TTL in seconds
```

### Using State in Python Steps

```python
# Example: Caching extracted fields during document processing

config = {
    "type": "event",
    "name": "ExtractFields",
    "subscribes": ["document.ocr.completed"],
    "emits": ["document.extraction.completed"],
    "flows": ["DocumentProcessing"]
}


async def handler(event, ctx):
    """Extract fields from document and cache results."""

    document_id = event["data"]["document_id"]
    ocr_text = event["data"]["ocr_text"]

    # Check if already cached (useful for reprocessing)
    cached = await ctx.state.get(ctx.trace_id, f"extracted_fields:{document_id}")
    if cached:
        ctx.logger.info("Using cached extraction", {"document_id": document_id})
        return

    # Perform extraction
    extractor = await AIProviderFactory.get_provider(AITask.EXTRACTION, db)
    result = await extractor.extract_fields(ocr_text, schema)

    # Cache the results using MOTIA state
    await ctx.state.set(
        ctx.trace_id,
        f"extracted_fields:{document_id}",
        result.model_dump()
    )

    # Also cache dossier-level aggregated data
    await ctx.state.set(
        ctx.trace_id,
        f"dossier_fields:{event['data']['dossier_id']}",
        {"document_id": document_id, "fields": result.fields}
    )

    await ctx.emit({
        "topic": "document.extraction.completed",
        "data": {
            "document_id": document_id,
            "dossier_id": event["data"]["dossier_id"],
            "field_count": len(result.fields)
        }
    })
```

### State Scoping with trace_id

MOTIA state is scoped by `trace_id`, which isolates data between different workflow executions:

```python
# Each workflow execution has a unique trace_id
# State is automatically cleaned up when the workflow completes

# Store workflow-specific data
await ctx.state.set(ctx.trace_id, "validation_progress", {"step": 1, "total": 5})

# Retrieve later in the same workflow
progress = await ctx.state.get(ctx.trace_id, "validation_progress")

# Clear all state for this workflow
await ctx.state.clear(ctx.trace_id)
```

### When Redis is Still Needed

While MOTIA's state management handles most caching needs, Redis may still be used for:

| Use Case | Recommendation |
|----------|----------------|
| **MOTIA State (Production)** | Use Redis adapter for distributed state |
| **Session Storage** | Can use MOTIA state or separate Redis instance |
| **Rate Limiting** | Implement as MOTIA middleware or use Redis |
| **Distributed Locks** | Use Redis for cross-instance coordination |
| **Pub/Sub** | MOTIA handles event routing; Redis optional for external systems |

### Caching Strategy Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CACHING ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    MOTIA Built-in State Management                   │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  • Workflow state (extraction results, validation progress)  │    │    │
│  │  │  • Temporary data between steps                              │    │    │
│  │  │  • Scoped by trace_id for isolation                          │    │    │
│  │  │  • Automatic cleanup on workflow completion                  │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Redis (Production State Adapter)                  │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  • Distributed state persistence                             │    │    │
│  │  │  • TTL support for automatic expiration                      │    │    │
│  │  │  • Multi-instance coordination                               │    │    │
│  │  │  • Optional: Rate limiting, distributed locks                │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Recommendations

### 1. Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | MOTIA | Event-driven workflow orchestration with Python support |
| **Language** | Python | End-to-end Python for consistency and AI/ML integration |
| **Database** | PostgreSQL | JSONB support, robust transactions |
| **ORM** | SQLAlchemy | Async support, mature Python ORM |
| **Validation** | Pydantic | Type-safe data validation and serialization |
| **State/Cache** | MOTIA State (Redis adapter) | Built-in state management for production |
| **Search** | Typesense | Fast, typo-tolerant search |
| **Storage** | S3/MinIO | Document storage |

### 2. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION DEPLOYMENT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Load Balancer (nginx/traefik)                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                       │                                      │
│         ┌─────────────────────────────┼─────────────────────────────┐       │
│         ▼                             ▼                             ▼       │
│  ┌─────────────┐             ┌─────────────┐             ┌─────────────┐    │
│  │   MOTIA     │             │   MOTIA     │             │   MOTIA     │    │
│  │  Instance 1 │             │  Instance 2 │             │  Instance 3 │    │
│  │  (Python)   │             │  (Python)   │             │  (Cron)     │    │
│  └─────────────┘             └─────────────┘             └─────────────┘    │
│         │                             │                             │       │
│         └─────────────────────────────┼─────────────────────────────┘       │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Shared Services                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │PostgreSQL│ │  Redis   │ │ Typesense│ │  MinIO   │               │    │
│  │  │ (Primary)│ │ (State)  │ │ (Search) │ │(Storage) │               │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Security Recommendations

1. **Authentication**: JWT with refresh tokens, stored in HttpOnly cookies
2. **Authorization**: Role-based access control (RBAC) with middleware
3. **API Security**: Rate limiting, input validation, CORS configuration
4. **Data Protection**: Encrypt sensitive data at rest (API keys, personal data)
5. **Audit Trail**: Comprehensive activity logging for compliance

### 4. Scalability Considerations

1. **Horizontal Scaling**: MOTIA instances can be scaled independently
2. **Database**: Read replicas for analytics queries
3. **Document Processing**: Queue-based processing with worker pools
4. **State Management**: Redis adapter for distributed state across instances
5. **Search**: Typesense cluster for high-volume search

### 5. Development Workflow

```bash
# Initialize MOTIA project with Python
npx motia init cee-validation-backend --python

# Project structure
cd cee-validation-backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install Python dependencies
pip install -r requirements.txt

# Development
npx motia dev

# Access Workbench UI
# http://localhost:3000/workbench
```

### Python Dependencies (requirements.txt)

```txt
# Core
pydantic>=2.0
sqlalchemy[asyncio]>=2.0
asyncpg
python-dotenv

# AI/ML
openai
anthropic
httpx

# OCR
docling
paddleocr

# Search
typesense

# Storage
boto3

# Utilities
python-jose[cryptography]
passlib[bcrypt]
```

### 6. MOTIA Flows Organization

| Flow Name | Purpose | Steps |
|-----------|---------|-------|
| `DocumentProcessing` | Document upload → OCR → Extraction | upload, classify, ocr, extract |
| `ValidationPipeline` | Field validation → Rule execution | document-rules, cross-doc-rules, confidence |
| `FeedbackLoop` | Human corrections → Training data | process-correction, update-dataset |
| `BillingWorkflow` | Approval → Invoice → Payment | calculate-premium, generate-invoice |
| `BulkUploadFlow` | Bulk upload → Split → Detect → Validate → Notify | split-pdf, detect-process, validate-completeness |
| `Maintenance` | Scheduled tasks | cleanup, sync-search, verify-rge |

### 7. Bulk Upload Workflow (Event-Driven)

The bulk upload workflow enables installers to submit documents without knowing the exact CEE process. The system automatically detects processes and validates document completeness.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BULK UPLOAD WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐ │
│  │   Installer  │     │   API Step   │     │ Event Steps  │     │   Email    │ │
│  │   Uploads    │────▶│  bulk_upload │────▶│  (Pipeline)  │────▶│   Notify   │ │
│  │   Files      │     │   .step.py   │     │              │     │            │ │
│  └──────────────┘     └──────────────┘     └──────────────┘     └────────────┘ │
│                              │                    │                             │
│                              │                    ▼                             │
│                              │         ┌──────────────────────┐                 │
│                              │         │ 1. split_pdf_document │                │
│                              │         │    - Detect page      │                │
│                              │         │      boundaries       │                │
│                              │         │    - Create child     │                │
│                              │         │      documents        │                │
│                              │         └──────────┬───────────┘                 │
│                              │                    ▼                             │
│                              │         ┌──────────────────────┐                 │
│                              │         │ 2. classify_document  │                │
│                              │         │    - AI classification│                │
│                              │         │    - Document type    │                │
│                              │         └──────────┬───────────┘                 │
│                              │                    ▼                             │
│                              │         ┌──────────────────────┐                 │
│                              │         │ 3. detect_process    │                │
│                              │         │    - Scan attestation │                │
│                              │         │    - Extract CEE codes│                │
│                              │         │    - Match processes  │                │
│                              │         └──────────┬───────────┘                 │
│                              │                    ▼                             │
│                              │         ┌──────────────────────┐                 │
│                              │         │ 4. validate_complete │                │
│                              │         │    - Check required   │                │
│                              │         │      docs per process │                │
│                              │         │    - Identify missing │                │
│                              │         └──────────┬───────────┘                 │
│                              │                    ▼                             │
│                              │         ┌──────────────────────┐                 │
│                              │         │ 5. send_notification │                │
│                              │         │    - Missing docs?    │                │
│                              │         │      → Email installer│                │
│                              │         │    - Complete?        │                │
│                              │         │      → Ready for      │                │
│                              │         │        validation     │                │
│                              │         └──────────────────────┘                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Bulk Upload Event Steps

```python
# steps/events/bulk_upload/split_pdf_document.step.py

config = {
    "type": "event",
    "name": "SplitPDFDocument",
    "description": "Split multi-page PDF into individual documents",
    "subscribes": ["bulk_upload.document.received"],
    "emits": ["bulk_upload.document.split", "bulk_upload.document.split_failed"],
    "flows": ["BulkUploadFlow"]
}

async def handler(event, ctx):
    """Split multi-page PDF based on document boundaries."""
    document_id = event["data"]["document_id"]

    # Get document from storage
    document = await get_document(document_id)

    if document["page_count"] <= 1:
        # Single page, no split needed
        await ctx.emit({
            "topic": "bulk_upload.document.split",
            "data": {"document_id": document_id, "split_documents": [document_id]}
        })
        return

    # Use AI to detect document boundaries
    ai_provider = await get_ai_provider(ctx, "classification")
    boundaries = await ai_provider.detect_document_boundaries(document["content"])

    # Split and store individual documents
    split_docs = await split_pdf_at_boundaries(document, boundaries)

    await ctx.emit({
        "topic": "bulk_upload.document.split",
        "data": {
            "original_document_id": document_id,
            "split_documents": [doc["id"] for doc in split_docs]
        }
    })
```

```python
# steps/events/bulk_upload/detect_process_codes.step.py

config = {
    "type": "event",
    "name": "DetectProcessCodes",
    "description": "Detect CEE process codes from Attestation sur l'honneur",
    "subscribes": ["bulk_upload.document.classified"],
    "emits": ["bulk_upload.process.detected"],
    "flows": ["BulkUploadFlow"]
}

async def handler(event, ctx):
    """Extract CEE process codes from attestation documents."""
    dossier_id = event["data"]["dossier_id"]
    documents = event["data"]["documents"]

    detected_processes = []

    for doc in documents:
        if doc["type"] == "attestation_honneur":
            # Extract text and look for process codes
            text = doc.get("ocr_text", "")

            # Pattern matching for CEE codes (BAR-TH-XXX, BAR-EN-XXX, etc.)
            codes = extract_cee_codes(text)

            for code in codes:
                process = await get_process_by_code(code)
                if process:
                    detected_processes.append({
                        "code": code,
                        "name": process["name"],
                        "confidence": 0.95,
                        "detected_from": doc["id"]
                    })

    await ctx.emit({
        "topic": "bulk_upload.process.detected",
        "data": {
            "dossier_id": dossier_id,
            "detected_processes": detected_processes
        }
    })
```

```python
# steps/events/bulk_upload/validate_document_completeness.step.py

config = {
    "type": "event",
    "name": "ValidateDocumentCompleteness",
    "description": "Check if all required documents are present for detected processes",
    "subscribes": ["bulk_upload.process.detected"],
    "emits": ["bulk_upload.validation.complete", "bulk_upload.documents.missing"],
    "flows": ["BulkUploadFlow"]
}

async def handler(event, ctx):
    """Validate that all required documents are present."""
    dossier_id = event["data"]["dossier_id"]
    detected_processes = event["data"]["detected_processes"]

    # Get all documents in dossier
    documents = await get_dossier_documents(dossier_id)
    doc_types = {doc["type"] for doc in documents}

    missing_documents = []

    for process in detected_processes:
        # Get required documents for this process
        required_docs = await get_required_documents(process["code"])

        for req_doc in required_docs:
            if req_doc["type"] not in doc_types:
                missing_documents.append({
                    "document_type": req_doc["type"],
                    "document_name": req_doc["name"],
                    "process_code": process["code"],
                    "is_required": req_doc["is_required"]
                })

    if missing_documents:
        await ctx.emit({
            "topic": "bulk_upload.documents.missing",
            "data": {
                "dossier_id": dossier_id,
                "missing_documents": missing_documents
            }
        })
    else:
        await ctx.emit({
            "topic": "bulk_upload.validation.complete",
            "data": {
                "dossier_id": dossier_id,
                "status": "ready_for_validation"
            }
        })
```

```python
# steps/events/bulk_upload/send_missing_documents_email.step.py

config = {
    "type": "event",
    "name": "SendMissingDocumentsEmail",
    "description": "Send email to installer about missing documents",
    "subscribes": ["bulk_upload.documents.missing"],
    "emits": ["notification.email.sent"],
    "flows": ["BulkUploadFlow"]
}

async def handler(event, ctx):
    """Send email notification about missing documents."""
    dossier_id = event["data"]["dossier_id"]
    missing_documents = event["data"]["missing_documents"]

    # Get dossier and installer info
    dossier = await get_dossier(dossier_id)
    installer = await get_installer(dossier["installer_id"])

    # Prepare email content
    email_content = render_missing_documents_email(
        installer_name=installer["contact_name"],
        dossier_reference=dossier["reference"],
        missing_documents=missing_documents,
        upload_url=f"/portal/dossiers/{dossier_id}/add-documents"
    )

    # Send email
    await send_email(
        to=dossier["notification_email"] or installer["contact_email"],
        subject=f"Documents manquants - Dossier {dossier['reference']}",
        html_content=email_content
    )

    # Update dossier status
    await update_dossier_status(dossier_id, "awaiting_documents")

    await ctx.emit({
        "topic": "notification.email.sent",
        "data": {
            "dossier_id": dossier_id,
            "email_type": "missing_documents",
            "recipient": dossier["notification_email"]
        }
    })
```

#### Bulk Upload Event Topics

```python
# Additional event topics for bulk upload workflow

class BulkUploadEventTopics:
    """Event topics for bulk upload workflow."""

    # Upload events
    BULK_UPLOAD_STARTED = "bulk_upload.started"
    DOCUMENT_RECEIVED = "bulk_upload.document.received"
    DOCUMENT_SPLIT = "bulk_upload.document.split"
    DOCUMENT_SPLIT_FAILED = "bulk_upload.document.split_failed"
    DOCUMENT_CLASSIFIED = "bulk_upload.document.classified"

    # Process detection events
    PROCESS_DETECTED = "bulk_upload.process.detected"
    PROCESS_DETECTION_FAILED = "bulk_upload.process.detection_failed"

    # Validation events
    VALIDATION_COMPLETE = "bulk_upload.validation.complete"
    DOCUMENTS_MISSING = "bulk_upload.documents.missing"

    # Notification events
    MISSING_DOCS_EMAIL_SENT = "bulk_upload.notification.missing_docs_sent"
    UPLOAD_COMPLETE_EMAIL_SENT = "bulk_upload.notification.complete_sent"
```

### 8. Event Topics

```python
# config/events.py - Event topic constants

class EventTopics:
    """Event topic constants for MOTIA event-driven architecture."""

    # Document events
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_CLASSIFIED = "document.classified"
    DOCUMENT_OCR_COMPLETED = "document.ocr.completed"
    DOCUMENT_EXTRACTION_COMPLETED = "document.extraction.completed"
    DOCUMENT_VALIDATION_COMPLETED = "document.validation.completed"

    # Dossier events
    DOSSIER_CREATED = "dossier.created"
    DOSSIER_SUBMITTED = "dossier.submitted"
    DOSSIER_ASSIGNED = "dossier.assigned"
    DOSSIER_APPROVED = "dossier.approved"
    DOSSIER_REJECTED = "dossier.rejected"

    # Validation events
    FIELD_CONFIRMED = "field.confirmed"
    FIELD_CORRECTED = "field.corrected"
    FIELD_MARKED_WRONG = "field.marked_wrong"
    RULE_OVERRIDDEN = "rule.overridden"

    # Feedback events
    FEEDBACK_STORED = "feedback.stored"
    TRAINING_DATASET_UPDATED = "training.dataset.updated"

    # Billing events
    INVOICE_GENERATED = "invoice.generated"
    PAYMENT_RECORDED = "payment.recorded"
```

### 8. Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/cee_validation

# Redis (for MOTIA state adapter in production)
REDIS_URL=redis://localhost:6379

# Typesense
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=your-api-key

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=cee-documents

# AI Providers (configured in database, but defaults here)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# JWT
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=60
JWT_REFRESH_EXPIRES_DAYS=7

# Application
ENVIRONMENT=development
PORT=3000
DEBUG=true
```

### 9. Python Settings Configuration

```python
# config/settings.py

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Typesense
    TYPESENSE_HOST: str = "localhost"
    TYPESENSE_PORT: int = 8108
    TYPESENSE_PROTOCOL: str = "http"
    TYPESENSE_API_KEY: str

    # Storage
    S3_ENDPOINT: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str = "cee-documents"

    # AI Providers
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60
    JWT_REFRESH_EXPIRES_DAYS: int = 7

    # Application
    ENVIRONMENT: str = "development"
    PORT: int = 3000
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
```

---

## Appendix: MOTIA Step Examples (Python)

### API Step Example (Document Upload)

```python
# steps/api/documents/upload_document.step.py

from pydantic import BaseModel
from typing import Optional

from services.storage import StorageService
from models.document import Document
from config.database import get_db_session
from config.events import EventTopics


class UploadRequest(BaseModel):
    document_type: Optional[str] = None


config = {
    "type": "api",
    "name": "UploadDocument",
    "path": "/dossiers/:dossier_id/documents",
    "method": "POST",
    "emits": [EventTopics.DOCUMENT_UPLOADED],
    "flows": ["DocumentProcessing"]
}


async def handler(req, ctx):
    """Handle document upload."""

    dossier_id = req.params["dossier_id"]
    file = req.files.get("file")
    body = UploadRequest(**req.body) if req.body else UploadRequest()

    # Upload to S3
    storage_service = StorageService()
    storage_path = await storage_service.upload(file, dossier_id)

    # Create document record
    async with get_db_session() as db:
        document = Document(
            dossier_id=dossier_id,
            filename=file.filename,
            original_filename=file.filename,
            storage_path=storage_path,
            mime_type=file.content_type,
            file_size=file.size,
            processing_status="pending"
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)

    # Emit event to trigger processing pipeline
    await ctx.emit({
        "topic": EventTopics.DOCUMENT_UPLOADED,
        "data": {
            "dossier_id": dossier_id,
            "document_id": str(document.id),
            "storage_path": storage_path,
            "mime_type": file.content_type,
            "suggested_type": body.document_type
        }
    })

    ctx.logger.info("Document uploaded", {"document_id": str(document.id)})

    return {
        "status": 201,
        "body": {"id": str(document.id), "status": "processing"}
    }
```

### Event Step Example (Document Classification)

```python
# steps/events/document_processing/classify_document.step.py

from services.ai.provider_factory import AIProviderFactory, AITask
from services.storage import StorageService
from models.document import Document
from config.database import get_db_session
from config.events import EventTopics


config = {
    "type": "event",
    "name": "ClassifyDocument",
    "subscribes": [EventTopics.DOCUMENT_UPLOADED],
    "emits": [EventTopics.DOCUMENT_CLASSIFIED],
    "flows": ["DocumentProcessing"]
}


async def handler(event, ctx):
    """Classify uploaded document using AI."""

    data = event["data"]
    dossier_id = data["dossier_id"]
    document_id = data["document_id"]
    storage_path = data["storage_path"]
    mime_type = data["mime_type"]

    ctx.logger.info("Classifying document", {"document_id": document_id})

    # Get AI provider for classification
    async with get_db_session() as db:
        ai_provider = await AIProviderFactory.get_provider(AITask.CLASSIFICATION, db)

    # Download document from storage
    storage_service = StorageService()
    document_bytes = await storage_service.download(storage_path)

    # Classify document
    classification = await ai_provider.classify_document(
        document_bytes,
        mime_type,
        possible_types=["devis", "facture", "attestation_honneur", "photos"]
    )

    # Update document record
    async with get_db_session() as db:
        document = await db.get(Document, document_id)
        document.document_type_id = classification.document_type
        document.classification_confidence = classification.confidence
        document.processing_status = "classified"
        await db.commit()

    # Cache classification result using MOTIA state
    await ctx.state.set(
        ctx.trace_id,
        f"classification:{document_id}",
        classification.model_dump()
    )

    await ctx.emit({
        "topic": EventTopics.DOCUMENT_CLASSIFIED,
        "data": {
            "dossier_id": dossier_id,
            "document_id": document_id,
            "document_type": classification.document_type,
            "confidence": classification.confidence
        }
    })
```

### Cron Step Example (Cleanup Old State)

```python
# steps/cron/cleanup_old_state.step.py

from datetime import datetime, timedelta
from sqlalchemy import select, delete

from models.activity import ActivityLog
from config.database import get_db_session


config = {
    "type": "cron",
    "name": "CleanupOldState",
    "cron": "0 2 * * *",  # Daily at 2 AM
    "flows": ["Maintenance"]
}


async def handler(ctx):
    """Clean up old activity logs and temporary data."""

    ctx.logger.info("Starting cleanup job")

    # Delete activity logs older than 90 days
    cutoff_date = datetime.utcnow() - timedelta(days=90)

    async with get_db_session() as db:
        result = await db.execute(
            delete(ActivityLog)
            .where(ActivityLog.created_at < cutoff_date)
        )
        deleted_count = result.rowcount
        await db.commit()

    ctx.logger.info(f"Deleted {deleted_count} old activity logs")

    # Note: MOTIA state is automatically cleaned up when workflows complete
    # No manual cleanup needed for ctx.state
```

---

*Document generated for CEE Validation System Backend Architecture*
*MOTIA Framework Version: Latest*
*Python-First Architecture*
*Last Updated: November 2025*