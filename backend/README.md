# CEE Validation System Backend

A comprehensive CEE (Certificat d'Économie d'Énergie) document validation system built with FastAPI, SQLAlchemy, and PostgreSQL.

## Features

- **Role-Based Access Control**: Three roles (Administrator, Validator, Installer) with distinct permissions
- **Dossier Management**: Complete dossier lifecycle from creation to approval/rejection
- **Document Processing**: Upload, classify, extract, and validate documents using AI
- **AI-Powered Extraction**: Model-agnostic AI layer supporting multiple providers (OpenAI, Anthropic, Mistral, local)
- **Validation Engine**: Flexible rule engine with expression-based validation
- **Activity Logging**: Comprehensive audit trail for all system activities
- **Billing & Invoicing**: Complete billing workflow with invoice generation
- **Analytics & Reporting**: Dashboard metrics and performance tracking
- **Search Integration**: Typesense-powered search across dossiers, documents, and installers
- **Feedback Loop**: Human feedback collection for continuous AI model improvement

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: Async SQL toolkit and ORM
- **PostgreSQL**: Relational database with JSONB support
- **Alembic**: Database migration tool
- **JWT**: Authentication tokens with refresh support
- **Pydantic**: Data validation and serialization
- **AWS S3/MinIO**: Cloud storage for documents (with local storage fallback)
- **Redis**: Caching and state management (optional)
- **Typesense**: Fast, typo-tolerant search engine (optional)
- **Boto3**: AWS SDK for Python

## Architecture

The backend follows a clean architecture pattern:

```
backend/
├── app/
│   ├── api/              # API endpoints (REST routes)
│   ├── core/             # Core configuration and dependencies
│   ├── models/           # SQLAlchemy database models
│   ├── schemas/          # Pydantic request/response schemas
│   └── services/         # Business logic services
│       ├── ai/           # AI abstraction layer
│       ├── activity/     # Activity logging
│       ├── rules/        # Rule engine
│       ├── search/       # Search service
│       └── storage/      # File storage
├── alembic/              # Database migrations
├── scripts/              # Utility scripts
└── tests/                # Test suite
```

## Setup

### Prerequisites

- Python 3.11+
- Docker and Docker Compose (for PostgreSQL, Redis, Typesense)
- pip or poetry
- AWS Account with S3 bucket (optional, can use local storage)

### Installation

1. **Clone the repository and navigate to the backend directory:**
```bash
cd backend
```

2. **Create a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Start Docker services:**
```bash
docker compose up -d
```
This starts PostgreSQL on port 5433 (to avoid conflicts with existing PostgreSQL).

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Create a `.env` file:**
```bash
cp .env.example .env
```

6. **Update the `.env` file with your configuration:**

**Database:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/pdf_checker
```

**JWT:**
```env
SECRET_KEY=your-strong-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**File Storage (AWS S3 or MinIO):**
```env
USE_S3=true
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=cee-documents
S3_ENDPOINT_URL=  # Leave empty for AWS S3, or set to MinIO endpoint
```

**Redis (Optional, for caching):**
```env
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
```

**Typesense (Optional, for search):**
```env
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

**AI Providers (Optional, can be configured in database):**
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...
```

**CORS:**
```env
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
```

7. **Run migrations:**
```bash
alembic upgrade head
```

8. **Initialize admin user:**
```bash
python scripts/init_db.py
```

9. **Start the server:**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Database Schema

### Core Tables

- **users**: User accounts with roles (Administrator, Validator, Installer)
- **installers**: Installer companies with RGE information
- **processes**: CEE process configurations
- **dossiers**: Main dossier entities (replaces old "submissions")
- **documents**: Uploaded documents (replaces old "submission_files")
- **document_types**: Document type definitions
- **extracted_fields**: AI-extracted field data
- **field_schemas**: Field schema definitions for extraction
- **validation_rules**: Validation rule configurations
- **validation_results**: Rule execution results
- **human_feedback**: Feedback for AI model improvement
- **invoices**: Billing and invoicing
- **activity_logs**: System activity audit trail
- **ai_configurations**: AI provider configurations
- **model_performance_metrics**: AI model performance tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/password` - Change password

### Dossiers
- `POST /api/dossiers` - Create new dossier
- `GET /api/dossiers` - List dossiers (with filters, pagination)
- `GET /api/dossiers/{id}` - Get dossier details
- `PATCH /api/dossiers/{id}` - Update dossier
- `DELETE /api/dossiers/{id}` - Delete dossier
- `POST /api/dossiers/{id}/assign` - Assign validator

### Documents
- `POST /api/dossiers/{id}/documents` - Upload document(s)
- `GET /api/dossiers/{id}/documents` - List dossier documents
- `GET /api/documents/{id}` - Get document details
- `GET /api/documents/{id}/download` - Download document file
- `POST /api/documents/{id}/reprocess` - Reprocess document

### Validation
- `GET /api/dossiers/{id}/validation` - Get validation state
- `GET /api/dossiers/{id}/fields` - Get extracted fields
- `PATCH /api/dossiers/{id}/fields/{field_id}` - Update field value
- `POST /api/dossiers/{id}/fields/{field_id}/confirm` - Confirm field
- `POST /api/dossiers/{id}/approve` - Approve dossier
- `POST /api/dossiers/{id}/reject` - Reject dossier

### Processes
- `POST /api/processes` - Create CEE process
- `GET /api/processes` - List processes
- `GET /api/processes/{id}` - Get process details
- `PATCH /api/processes/{id}` - Update process
- `POST /api/processes/{id}/clone` - Clone process

### Installers
- `POST /api/installers` - Create installer
- `GET /api/installers` - List installers
- `GET /api/installers/{id}` - Get installer details
- `PATCH /api/installers/{id}` - Update installer
- `POST /api/installers/{id}/verify-rge` - Verify RGE status

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/{id}` - Get user details
- `PATCH /api/users/{id}` - Update user
- `POST /api/users/{id}/activate` - Activate user
- `POST /api/users/{id}/deactivate` - Deactivate user
- `POST /api/users/{id}/reset-password` - Admin reset password

### Billing
- `GET /api/billing/summary` - Get billing summary
- `GET /api/billing/dossiers` - List billable dossiers
- `POST /api/billing/dossiers/{id}/invoice` - Generate invoice
- `POST /api/billing/dossiers/{id}/payment` - Record payment
- `GET /api/billing/invoices` - List invoices
- `GET /api/billing/invoices/{id}` - Get invoice details

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard metrics
- `GET /api/analytics/validation` - Get validation statistics
- `GET /api/analytics/processing` - Get processing metrics
- `GET /api/analytics/model-performance` - Get AI model metrics

### Activity
- `GET /api/activity` - List activity logs (with filters)
- `GET /api/activity/{id}` - Get activity details

### Search
- `GET /api/search` - Global search
- `GET /api/search/dossiers` - Search dossiers
- `GET /api/search/documents` - Search documents
- `GET /api/search/installers` - Search installers

### Rules
- `POST /api/rules` - Create validation rule
- `GET /api/rules` - List rules
- `GET /api/rules/{id}` - Get rule details
- `PATCH /api/rules/{id}` - Update rule
- `DELETE /api/rules/{id}` - Delete rule
- `POST /api/rules/{id}/test` - Test rule
- `POST /api/rules/{id}/toggle` - Enable/disable rule

### Schemas
- `POST /api/schemas` - Create field schema
- `GET /api/schemas` - List schemas
- `GET /api/schemas/{id}` - Get schema details
- `PATCH /api/schemas/{id}` - Update schema
- `DELETE /api/schemas/{id}` - Delete schema
- `GET /api/schemas/{id}/fields` - Get schema fields

### Feedback
- `POST /api/feedback` - Submit correction feedback
- `GET /api/feedback` - List feedback entries
- `GET /api/feedback/{id}` - Get feedback details
- `GET /api/feedback/stats` - Get feedback statistics
- `POST /api/feedback/export` - Export training dataset

### AI Configuration
- `GET /api/ai/config` - Get AI configuration
- `PATCH /api/ai/config` - Update AI configuration
- `GET /api/ai/providers` - List available providers
- `POST /api/ai/providers/{id}/test` - Test provider connection
- `GET /api/ai/models` - List available models

## Docker Services Management

### Start services:
```bash
docker compose up -d
```

### Stop services:
```bash
docker compose down
```

### View logs:
```bash
docker compose logs -f
```

### Reset database (WARNING: deletes all data):
```bash
docker compose down -v
docker compose up -d
alembic upgrade head
python scripts/init_db.py
```

## Development

### Running Tests
```bash
pytest
```

### Creating Migrations
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Code Formatting
```bash
black .
isort .
```

## Docker Deployment

### Building the Docker Image

```bash
docker build -t cee-validation-backend .
```

### Running with Docker Compose (Production)

```bash
# Copy and configure .env file
cp .env.example .env
# Edit .env with your production settings

# Start services
docker compose -f docker-compose.prod.yml up -d
```

### Docker Image Details

- **Base Image**: Python 3.11-slim
- **Port**: 8000
- **Health Check**: `/health` endpoint
- **Non-root user**: Runs as `appuser` for security
- **Auto-migrations**: Runs `alembic upgrade head` on startup

### Environment Variables for Production

Make sure to set these in your `.env` file or Docker environment:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname

# Security
SECRET_KEY=your-strong-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=cee-documents
USE_S3=true

# Optional Services
REDIS_URL=redis://redis:6379
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_API_KEY=your-api-key

# AI Providers (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
CORS_ORIGINS=["https://yourdomain.com"]
ENVIRONMENT=production
DEBUG=false
```

### Dockerfile Features

- Multi-stage build for smaller image size
- Non-root user for security
- Health check endpoint
- Automatic database migrations on startup
- Optimized layer caching

## Architecture Notes

### Model Changes from Previous Version

- `Submission` → `Dossier`
- `SubmissionFile` → `Document`
- `ExtractedData` → `ExtractedField`
- `Rule` → `ValidationRule`
- `RuleResult` → `ValidationResult`
- `Schema` → `FieldSchema`
- `AuditLog` → `ActivityLog`

### User Model Changes

- `id`: `Integer` → `UUID`
- `hashed_password` → `password_hash`
- `is_active` → `active`
- `username` removed (use `email` for login)
- `role`: Enum values changed (ADMIN → ADMINISTRATOR)

### API Changes

- All endpoints now use UUIDs instead of integers
- RESTful structure with proper resource nesting
- All endpoints require authentication except `/api/auth/login`

## License

MIT
