# Changelog

## [2.0.0] - 2024-01-XX

### Added
- Role-based access control (RBAC) system with three roles: admin, validator, installer
- User model with authentication and role management
- JWT token-based authentication system
- Admin API endpoints for user, schema, and file type management
- FileType model to define file types and their required fields
- Authentication endpoint (`POST /auth/login`)
- Admin endpoints for creating users, schemas, and file types
- Role-based authorization middleware and dependencies
- Script to create initial admin user (`scripts/create_admin.py`)
- Database migration for user and file type models
- Updated dossier and schema models with user relationships

### Changed
- Upload endpoint now requires installer role and file_type_id
- Validation endpoint now requires validator role
- All endpoints (except login) now require JWT authentication
- Dossier model includes `created_by_id` and `file_type_id` foreign keys
- Schema model includes `created_by_id` foreign key

### Security
- Password hashing using bcrypt
- JWT token generation and validation
- Role-based endpoint protection
- Token expiration (24 hours default)

## [1.0.0] - 2024-01-XX

### Added
- FastAPI backend with PostgreSQL database
- Document upload endpoint with AV scanning and ZIP extraction
- Document extraction using Datalab API with PyMuPDF/Tesseract fallback
- Schema-based field mapping with pattern matching and heuristics
- Optional LlamaIndex integration for ambiguous field resolution
- User correction endpoint for field fixes
- Validation engine with JSONLogic and Python rules
- Audit logging for all operations
- S3 storage integration for document files
- Health check endpoint
- Schema validation endpoint
- Batch extraction endpoint
- Process types endpoint for required document types

### Database Models
- Process types and schemas (JSONB fields)
- Dossiers and documents
- Extractions and corrections
- Validations and audits
- All models use PostgreSQL JSONB for JSON fields

### Services
- Storage service (S3) for file management
- AV scanning service (ClamAV) with fail-open policy
- Datalab integration service (HTTP API)
- Extraction fallback service (PyMuPDF/Tesseract)
- Extraction service with schema mapping and pattern matching
- Classification service for document type detection
- Validation service (JSONLogic/Python rules)
- Audit service for traceability
- LlamaIndex service (optional) for AI-powered extraction

### API Endpoints
- `POST /upload` - Upload and classify documents
- `POST /extract` - Extract data from documents
- `POST /extract/confirm` - Confirm/correct extracted data
- `POST /extract/batch` - Batch extraction
- `POST /validate` - Validate dossier against rules
- `POST /schemas/validate` - Validate schema
- `GET /health` - Health check
- `GET /process-types/{id}/required-docs` - Get required document types

### Configuration
- Environment-based configuration with Pydantic settings
- Database connection pooling (asyncpg)
- CORS middleware
- Async/await support throughout
- Alembic migrations setup

### Documentation
- Comprehensive README with setup instructions
- QUICKSTART guide for rapid setup
- API endpoint documentation
- Environment variable examples
- Docker Compose setup for local development
- Database initialization script

### Infrastructure
- Docker Compose configuration for PostgreSQL and ClamAV
- Alembic migration setup
- Database initialization script
- Sample data seeding script

### Code Quality
- Type hints throughout
- Async/await patterns
- Error handling and logging
- Idempotent endpoints
- Audit trail for all operations
