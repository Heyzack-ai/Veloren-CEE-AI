# PDF Checker Backend

A comprehensive PDF analysis and validation system built with FastAPI, SQLAlchemy, and PostgreSQL.

## Features

- **Role-Based Access Control**: Three roles (ADMIN, VALIDATOR, INSTALLER) with distinct permissions
- **Document Type Management**: Create and manage document types with required PDF counts
- **Extraction Schemas**: JSON-based configuration for PDF data extraction
- **Validation Rules**: Flexible rule engine with JSON-based rule configurations
- **Submission Workflow**: Complete workflow from upload to approval/rejection
- **Audit Logging**: Comprehensive audit trail for all system activities

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Relational database
- **Alembic**: Database migration tool
- **JWT**: Authentication tokens
- **Pydantic**: Data validation
- **AWS S3**: Cloud storage for PDF files (with local storage fallback)
- **Boto3**: AWS SDK for Python

## Setup

### Prerequisites

- Python 3.11+
- Docker and Docker Compose (for PostgreSQL)
- pip
- AWS Account with S3 bucket (for file storage)

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Start Docker services:

**Option A: Use Docker PostgreSQL (if port 5432 is free):**
```bash
docker compose up -d
```
This starts PostgreSQL on port 5433 (to avoid conflicts with existing PostgreSQL).

**Option B: Use existing PostgreSQL (if you already have PostgreSQL running):**
```bash
# Create database in your existing PostgreSQL
# Replace 'your_user' and 'your_password' with your PostgreSQL credentials
createdb -U your_user pdf_checker
# OR using psql:
# psql -U your_user -c "CREATE DATABASE pdf_checker;"
```

**Note:** If you have PostgreSQL running on port 5432, Docker Compose will use port 5433 to avoid conflicts. Update your `.env` file accordingly.

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

6. Update the `.env` file with your configuration:

**For Docker PostgreSQL (port 5433):**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/pdf_checker
```

**For existing PostgreSQL (port 5432):**
```env
DATABASE_URL=postgresql+asyncpg://your_user:your_password@localhost:5432/pdf_checker
```

**For AWS S3 (required):**
```env
USE_S3=true
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
# Leave S3_ENDPOINT_URL empty for production AWS S3
```

7. Create S3 bucket in AWS (if not already created):
```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

### AWS S3 Configuration

The system uses AWS S3 for PDF file storage. To configure S3:

1. **Create an S3 bucket** in your AWS account:
   ```bash
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. **Create IAM user** with the following permissions:
   - `s3:PutObject` - Upload files
   - `s3:GetObject` - Download files
   - `s3:DeleteObject` - Delete files
   - `s3:HeadObject` - Check file existence

3. **Get AWS credentials** (Access Key ID and Secret Access Key) from the IAM user

4. **Update `.env` file** with your credentials:
   ```env
   USE_S3=true
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   # Leave S3_ENDPOINT_URL empty for production AWS S3
   ```

**Local Storage Fallback**: Set `USE_S3=false` in `.env` to use local file storage instead of S3 (not recommended for production).

8. Run migrations:
```bash
alembic upgrade head
```

9. Initialize admin user:
```bash
python scripts/init_db.py
```

10. Start the server:
```bash
uvicorn app.main:app --reload
```

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

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Database Schema

### Tables

- **users**: User accounts with roles
- **document_types**: Document type definitions
- **schemas**: Extraction configuration schemas
- **rules**: Validation rules
- **submissions**: Document submissions
- **submission_files**: Uploaded PDF files
- **extracted_data**: Extracted data from PDFs
- **rule_results**: Validation rule execution results
- **audit_logs**: System activity logs

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Admin Endpoints
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users
- `POST /api/admin/document-types` - Create document type
- `GET /api/admin/document-types` - List document types
- `POST /api/admin/schemas` - Create schema
- `GET /api/admin/schemas` - List schemas
- `POST /api/admin/rules` - Create rule
- `GET /api/admin/rules` - List rules
- `GET /api/admin/reports/system` - Get system reports

### Installer Endpoints
- `POST /api/installer/submissions` - Create submission
- `POST /api/installer/submissions/{id}/upload` - Upload PDF
- `POST /api/installer/submissions/{id}/submit` - Submit for validation
- `GET /api/installer/submissions` - List my submissions
- `GET /api/installer/submissions/{id}` - Get submission

### Validator Endpoints
- `GET /api/validator/submissions` - List submissions for validation
- `GET /api/validator/submissions/{id}` - Get submission
- `POST /api/validator/extract` - Run extraction
- `GET /api/validator/submissions/{id}/extracted-data` - Get extracted data
- `PUT /api/validator/extracted-data/{id}` - Update extracted data
- `POST /api/validator/validate` - Run validation
- `GET /api/validator/submissions/{id}/validation-results` - Get validation results
- `POST /api/validator/submissions/{id}/approve` - Approve submission
- `POST /api/validator/submissions/{id}/reject` - Reject submission

## Validation Rules

Validation rules use JSON-based configuration with the following operators:

- `eq`: Equal to
- `ne`: Not equal to
- `gt`: Greater than
- `gte`: Greater than or equal to
- `lt`: Less than
- `lte`: Less than or equal to
- `in`: Value in list
- `contains`: String contains
- `required`: Field is required
- `and`: Logical AND (all conditions must pass)
- `or`: Logical OR (at least one condition must pass)

Example rule configuration:
```json
{
  "operator": "and",
  "conditions": [
    {
      "field": "amount",
      "operator": "gte",
      "value": 1000
    },
    {
      "field": "status",
      "operator": "eq",
      "value": "active"
    }
  ]
}
```

## Extraction Schemas

Extraction schemas define how data is extracted from PDFs. The schema is a JSON configuration that specifies fields and extraction methods.

Example schema:
```json
{
  "fields": [
    {
      "name": "invoice_number",
      "type": "string",
      "pattern": "INV-\\d+"
    },
    {
      "name": "amount",
      "type": "number",
      "location": "top-right"
    }
  ]
}
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
docker build -t pdf-checker-backend .
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
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
SECRET_KEY=your-strong-secret-key-here
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
USE_S3=true
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

## License

MIT

