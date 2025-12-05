# CEE Validation System - API Documentation for Frontend Developers

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Flow](#user-roles--flow)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints by Category](#api-endpoints-by-category)
5. [Data Models & Field Explanations](#data-models--field-explanations)
6. [Common Patterns](#common-patterns)

---

## System Overview

The CEE (Certificat d'Économie d'Énergie) Validation System is a document validation platform where:
- **Administrators** manage the system, create accounts, and configure rules
- **Installers** upload documents for validation
- **Validators** review and validate uploaded documents

All API endpoints require Bearer token authentication (except login). The base URL is `https://veloren-dev.heyzack.ai` for production or `http://localhost:8000` for development.

---

## User Roles & Flow

### Role Hierarchy
1. **ADMINISTRATOR** - Full system access
2. **VALIDATOR** - Can validate documents and review extracted fields
3. **INSTALLER** - Can upload documents and create dossiers

### Complete User Flow

#### 1. Administrator Creates Accounts
- Administrator logs in with admin credentials
- Creates **Installer** account:
  - Provides: email, password, name, company details (SIRET, SIREN, address, etc.)
  - System creates: User account + Installer record
  - Returns: user_id, installer_id, credentials
  
- Creates **Validator** account:
  - Provides: email, password, name, employee details (department, specialization, etc.)
  - System creates: User account + Validator record
  - Returns: user_id, validator_id, credentials

#### 2. Installer Workflow
- Installer logs in with provided credentials
- Creates a **Dossier** (validation case):
  - Selects process type
  - Provides beneficiary information (name, address, precarity status)
  - Sets priority level
  - System generates dossier reference number
  
- Uploads **Documents** to dossier:
  - Uploads PDF files
  - System processes documents (extracts fields, classifies)
  - Documents get processing status (pending → processing → completed)
  
- Submits dossier for validation
- Can view dossier status and extracted fields

#### 3. Validator Workflow
- Validator logs in with provided credentials
- Views assigned dossiers (or all dossiers if admin)
- Reviews **Validation State**:
  - Sees extracted fields from documents
  - Sees validation rules results (passed/failed)
  - Sees field confidence scores
  
- Validates **Extracted Fields**:
  - Confirms correct fields
  - Updates incorrect field values
  - Confirms individual fields
  
- Reviews **Validation Rules**:
  - Sees which rules passed/failed
  - Can override rules if needed
  
- **Approves or Rejects** dossier:
  - If approved: dossier status → APPROVED (becomes billable)
  - If rejected: provides rejection reason, status → REJECTED

#### 4. Administrator Management
- Views dashboard metrics and analytics
- Manages validation rules and schemas
- Generates invoices for approved dossiers
- Records payments
- Views activity logs
- Manages AI configuration

---

## Authentication Flow

### Login Process
1. **POST /api/auth/login**
   - Send: `username` (email), `password`
   - Receive: `access_token`, `token_type` (always "bearer")
   - Token expires after configured time (default: 30 minutes)

### Using the Token
- Include in all requests: `Authorization: Bearer {access_token}`
- Token contains user ID and role information

### Token Refresh
- **POST /api/auth/refresh**
   - Send: `refresh_token`
   - Receive: New `access_token` and `refresh_token`

### Current User Info
- **GET /api/auth/me**
   - Returns: Current logged-in user details (id, email, name, role, active status)

### Logout
- **POST /api/auth/logout**
   - Invalidates current session (optional - token expiration handles this)

### Change Password
- **PUT /api/auth/change-password**
   - Send: `current_password`, `new_password` (min 8 characters)
   - Requires: Valid authentication token

---

## API Endpoints by Category

### Authentication Endpoints

#### Login
- **POST /api/auth/login**
  - **Request Fields:**
    - `username` (string): User's email address
    - `password` (string): User's password
  - **Response Fields:**
    - `access_token` (string): JWT token for API authentication
    - `token_type` (string): Always "bearer"

#### Get Current User
- **GET /api/auth/me**
  - **Response Fields:**
    - `id` (uuid): User's unique identifier
    - `email` (string): User's email address
    - `name` (string): User's full name
    - `role` (string): User's role (administrator, validator, installer)
    - `active` (boolean): Whether account is active

#### Refresh Token
- **POST /api/auth/refresh**
  - **Request Fields:**
    - `refresh_token` (string): Refresh token from login
  - **Response Fields:**
    - `access_token` (string): New JWT token
    - `refresh_token` (string): New refresh token
    - `token_type` (string): Always "bearer"

#### Change Password
- **PUT /api/auth/change-password**
  - **Request Fields:**
    - `current_password` (string): User's current password
    - `new_password` (string): New password (minimum 8 characters)
  - **Response Fields:**
    - `detail` (string): Success message

#### Logout
- **POST /api/auth/logout**
  - **Response:** Empty body (204 status)

---

### Installer Management

#### Create Installer Account
- **POST /api/installers**
  - **Access:** Administrator only
  - **Request Fields:**
    - `email` (string, required): Email for login
    - `password` (string, required, min 8 chars): Password for login
    - `name` (string, required): Full name
    - `company_name` (string, required): Company name
    - `siret` (string, required, 14 chars): French company registration number
    - `siren` (string, required, 9 chars): French company identifier
    - `address` (string, required): Street address
    - `city` (string, required): City name
    - `postal_code` (string, required): Postal/ZIP code
    - `contact_name` (string, required): Primary contact person
    - `contact_email` (string, required): Contact email
    - `contact_phone` (string, optional): Contact phone number
    - `rge_number` (string, optional): RGE certification number
    - `qualifications` (array of strings, optional): List of qualifications
  - **Response Fields:**
    - `user_id` (uuid): Created user account ID
    - `user_email` (string): User's email
    - `user_name` (string): User's name
    - `installer_id` (uuid): Created installer record ID
    - `siret` (string): Company SIRET
    - `company_name` (string): Company name
    - `city` (string): Company city
    - `active` (boolean): Account active status
    - `created_at` (datetime): Creation timestamp

#### List Installers
- **GET /api/installers**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `active` (boolean, optional): Filter by active status
    - `city` (string, optional): Filter by city
  - **Response:** Array of installer objects with:
    - `id` (uuid): Installer ID
    - `siret` (string): Company SIRET
    - `company_name` (string): Company name
    - `city` (string): Company city
    - `active` (boolean): Active status
    - `created_at` (datetime): Creation timestamp

#### Get Installer Details
- **GET /api/installers/{installer_id}**
  - **Access:** Authenticated users
  - **Response:** Single installer object (same structure as list)

#### Update Installer
- **PATCH /api/installers/{installer_id}**
  - **Access:** Administrator only
  - **Request Fields:** (all optional)
    - `company_name`, `address`, `city`, `postal_code`
    - `contact_name`, `contact_email`, `contact_phone`
    - `rge_number`, `active`
  - **Response:** Updated installer object

#### Verify RGE Status
- **POST /api/installers/{installer_id}/verify-rge**
  - **Access:** Administrator only
  - **Request Fields:**
    - `rge_number` (string, optional): RGE number to verify
    - `rge_valid_until` (date, optional): Expiration date
  - **Response Fields:**
    - `status` (string): Verification status
    - `message` (string): Status message

---

### Validator Management

#### Create Validator Account
- **POST /api/validators**
  - **Access:** Administrator only
  - **Request Fields:**
    - `email` (string, required): Email for login
    - `password` (string, required, min 8 chars): Password for login
    - `name` (string, required): Full name
    - `employee_id` (string, optional): Employee identifier (auto-generated if not provided)
    - `department` (string, optional): Department name
    - `specialization` (string, optional): Area of specialization
    - `certifications` (array of strings, optional): List of certifications
    - `max_concurrent_dossiers` (integer, optional): Max dossiers at once (default: 10)
    - `notes` (string, optional): Additional notes
  - **Response Fields:**
    - `user_id` (uuid): Created user account ID
    - `user_email` (string): User's email
    - `user_name` (string): User's name
    - `validator_id` (uuid): Created validator record ID
    - `employee_id` (string): Employee identifier
    - `department` (string): Department name
    - `specialization` (string): Specialization area
    - `active` (boolean): Account active status
    - `created_at` (datetime): Creation timestamp

#### List Validators
- **GET /api/validators**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `skip` (integer, optional): Pagination offset
    - `limit` (integer, optional): Results per page
  - **Response Fields:**
    - `items` (array): List of validator objects
    - `total` (integer): Total count
    - `skip` (integer): Current offset
    - `limit` (integer): Page size

#### Get Validator Details
- **GET /api/validators/{validator_id}**
  - **Access:** Authenticated users
  - **Response Fields:**
    - `id` (uuid): Validator ID
    - `user_id` (uuid): Associated user ID
    - `employee_id` (string): Employee identifier
    - `department` (string): Department
    - `specialization` (string): Specialization
    - `certifications` (array): List of certifications
    - `max_concurrent_dossiers` (integer): Max concurrent dossiers
    - `validation_stats` (object): Validation statistics
    - `notes` (string): Additional notes
    - `active` (boolean): Active status
    - `created_at`, `updated_at` (datetime): Timestamps

#### Update Validator
- **PATCH /api/validators/{validator_id}**
  - **Access:** Administrator only
  - **Request Fields:** (all optional)
    - `employee_id`, `department`, `specialization`
    - `certifications`, `max_concurrent_dossiers`
    - `validation_stats`, `notes`, `active`
  - **Response:** Updated validator object

---

### Dossier Management

#### Create Dossier
- **POST /api/dossiers**
  - **Access:** Installer, Administrator
  - **Request Fields:**
    - `process_id` (uuid, optional): Process type ID
    - `installer_id` (uuid, optional): Installer ID (auto-set for installer role)
    - `priority` (string, optional): Priority level (low, normal, high, urgent)
    - `beneficiary` (object, required):
      - `name` (string, required): Beneficiary full name
      - `address` (string, required): Street address
      - `city` (string, required): City name
      - `postal_code` (string, required): Postal code
      - `email` (string, optional): Email address
      - `phone` (string, optional): Phone number
      - `precarity_status` (boolean, optional): Precarity indicator
  - **Response Fields:**
    - `id` (uuid): Dossier ID
    - `reference` (string): Auto-generated dossier reference number
    - `process_id` (uuid): Process type ID
    - `installer_id` (uuid): Installer ID
    - `status` (string): Current status (draft, submitted, awaiting_review, etc.)
    - `priority` (string): Priority level
    - `beneficiary_name`, `beneficiary_address`, `beneficiary_city`, etc.
    - `precarity_status` (boolean): Precarity indicator
    - `created_at` (datetime): Creation timestamp

#### List Dossiers
- **GET /api/dossiers**
  - **Access:** All authenticated users (filtered by role)
  - **Query Parameters:**
    - `page` (integer, optional): Page number (default: 1)
    - `limit` (integer, optional): Results per page (default: 20)
    - `status` (string, optional): Filter by status
    - `installer_id` (uuid, optional): Filter by installer
    - `process_id` (uuid, optional): Filter by process
    - `assigned_validator_id` (uuid, optional): Filter by assigned validator
  - **Response Fields:**
    - `dossiers` (array): List of dossier objects (summary)
    - `total` (integer): Total count
    - `page` (integer): Current page
    - `limit` (integer): Page size

#### Get Dossier Details
- **GET /api/dossiers/{dossier_id}**
  - **Access:** Authenticated users (role-based access)
  - **Response:** Complete dossier object with all fields

#### Update Dossier
- **PATCH /api/dossiers/{dossier_id}**
  - **Access:** Administrator, Validator
  - **Request Fields:** (all optional)
    - `process_id`, `installer_id`, `priority`, `status`
    - `beneficiary` (object): Updated beneficiary information
  - **Response:** Updated dossier summary

#### Assign Validator to Dossier
- **POST /api/dossiers/{dossier_id}/assign**
  - **Access:** Administrator only
  - **Request Fields:**
    - `validator_id` (uuid, required): Validator to assign
  - **Response Fields:**
    - `id` (uuid): Dossier ID
    - `reference` (string): Dossier reference
    - `assigned_validator_id` (uuid): Assigned validator ID
    - `status` (string): Updated status

#### Delete Dossier
- **DELETE /api/dossiers/{dossier_id}**
  - **Access:** Administrator only
  - **Response:** Empty body (204 status)

---

### Document Management

#### Upload Document
- **POST /api/dossiers/{dossier_id}/documents**
  - **Access:** Installer, Administrator
  - **Request:** Multipart form data
    - `file` (file, required): PDF file to upload
    - `document_type_id` (uuid, optional): Document type classification
  - **Response Fields:**
    - `id` (uuid): Document ID
    - `filename` (string): Stored filename
    - `original_filename` (string): Original filename
    - `file_size` (integer): File size in bytes
    - `processing_status` (string): Status (pending, processing, completed, failed)
    - `uploaded_at` (datetime): Upload timestamp

#### List Documents in Dossier
- **GET /api/dossiers/{dossier_id}/documents**
  - **Access:** Authenticated users
  - **Response Fields:**
    - `documents` (array): List of document objects
    - `total` (integer): Total document count

#### Get Document Details
- **GET /api/documents/{document_id}**
  - **Access:** Authenticated users
  - **Response Fields:**
    - `id` (uuid): Document ID
    - `dossier_id` (uuid): Parent dossier ID
    - `filename`, `original_filename` (string): Filenames
    - `file_size` (integer): Size in bytes
    - `mime_type` (string): MIME type
    - `processing_status` (string): Current status
    - `uploaded_at` (datetime): Upload timestamp

#### Download Document
- **GET /api/documents/{document_id}/download**
  - **Access:** Authenticated users
  - **Response:** File content (binary) with appropriate Content-Type header

#### Reprocess Document
- **POST /api/documents/{document_id}/reprocess**
  - **Access:** Administrator, Validator
  - **Response Fields:**
    - `id` (uuid): Document ID
    - `filename` (string): Filename
    - `processing_status` (string): Reset to "pending"

---

### Validation Endpoints

#### Get Validation State
- **GET /api/dossiers/{dossier_id}/validation**
  - **Access:** Validator, Administrator
  - **Response Fields:**
    - `dossier_id` (uuid): Dossier ID
    - `status` (string): Overall validation status
    - `rules` (array): Validation rule results
      - `id` (uuid): Rule ID
      - `code` (string): Rule code
      - `name` (string): Rule name
      - `passed` (boolean): Whether rule passed
      - `status` (string): Rule status (passed, error, warning)
      - `message` (string): Rule result message
    - `fields` (array): Extracted field information
      - `id` (uuid): Field ID
      - `field_name` (string): Field identifier
      - `status` (string): Field status (unreviewed, confirmed, corrected)
      - `confidence` (number): AI confidence score (0-1)
    - `summary` (object): Validation summary statistics

#### Get Extracted Fields
- **GET /api/dossiers/{dossier_id}/fields**
  - **Access:** Validator, Administrator
  - **Response Fields:**
    - `fields` (array): List of extracted fields

#### Update Field Value
- **PATCH /api/dossiers/{dossier_id}/fields/{field_id}**
  - **Access:** Validator, Administrator
  - **Request Fields:**
    - `value` (string/number/boolean/object/array): New field value
  - **Response Fields:**
    - `id` (uuid): Field ID
    - `field_name` (string): Field identifier
    - `display_name` (string): Human-readable name
    - `extracted_value` (object): Original AI-extracted value
    - `corrected_value` (object): Updated value
    - `status` (string): Field status
    - `updated_at` (datetime): Update timestamp

#### Confirm Field
- **POST /api/dossiers/{dossier_id}/fields/{field_id}/confirm**
  - **Access:** Validator, Administrator
  - **Response Fields:**
    - `id` (uuid): Field ID
    - `field_name` (string): Field identifier
    - `display_name` (string): Human-readable name
    - `extracted_value` (object): Original value
    - `corrected_value` (object): Corrected value (if any)
    - `status` (string): Now "CONFIRMED"
    - `confirmed_at` (datetime): Confirmation timestamp
    - `confirmed_by` (uuid): Validator user ID

#### Approve Dossier
- **POST /api/dossiers/{dossier_id}/approve**
  - **Access:** Validator only
  - **Request Fields:**
    - `notes` (string, optional): Approval notes
  - **Response Fields:**
    - `id` (uuid): Dossier ID
    - `reference` (string): Dossier reference
    - `status` (string): Now "APPROVED"

#### Reject Dossier
- **POST /api/dossiers/{dossier_id}/reject**
  - **Access:** Validator only
  - **Request Fields:**
    - `reason` (string, required): Rejection reason
  - **Response Fields:**
    - `id` (uuid): Dossier ID
    - `reference` (string): Dossier reference
    - `status` (string): Now "REJECTED"

---

### Process Management

#### Create Process
- **POST /api/processes**
  - **Access:** Administrator only
  - **Request Fields:**
    - `code` (string, required): Process code (unique identifier)
    - `name` (string, required): Process name
    - `description` (string, optional): Process description
    - `category` (string, optional): Process category
    - `version` (string, optional): Version number
    - `is_active` (boolean, optional): Active status
    - `is_system` (boolean, optional): System process flag
    - `is_coup_de_pouce` (boolean, optional): Coup de pouce indicator
    - `valid_from` (date, optional): Valid from date
    - `valid_until` (date, optional): Valid until date
    - `metadata` (object, optional): Additional metadata
  - **Response:** Created process object

#### List Processes
- **GET /api/processes**
  - **Access:** Authenticated users
  - **Query Parameters:**
    - `is_active` (boolean, optional): Filter by active status
    - `category` (string, optional): Filter by category
  - **Response:** Array of process objects

#### Get Process Details
- **GET /api/processes/{process_id}**
  - **Access:** Authenticated users
  - **Response:** Complete process object

#### Update Process
- **PATCH /api/processes/{process_id}**
  - **Access:** Administrator only
  - **Request Fields:** (all optional, same as create)
  - **Response:** Updated process object

#### Clone Process
- **POST /api/processes/{process_id}/clone**
  - **Access:** Administrator only
  - **Request Fields:**
    - `new_code` (string, required): New process code
    - `name` (string, optional): New name
    - `version` (string, optional): Version number
  - **Response:** Cloned process object

---

### Validation Rules Management

#### Create Rule
- **POST /api/rules**
  - **Access:** Administrator only
  - **Request Fields:**
    - `code` (string, required): Rule code (unique)
    - `name` (string, required): Rule name
    - `description` (string, optional): Rule description
    - `process_id` (uuid, optional): Associated process
    - `document_type_id` (uuid, optional): Associated document type
    - `rule_type` (string, required): Type (document, cross_document, business)
    - `severity` (string, optional): Severity level (error, warning, info)
    - `expression` (string, required): Validation expression/logic
    - `error_message` (string, required): Error message when rule fails
    - `can_override` (boolean, optional): Whether rule can be overridden
    - `is_active` (boolean, optional): Active status
    - `version` (integer, optional): Rule version
  - **Response:** Created rule object

#### List Rules
- **GET /api/rules**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `process_id` (uuid, optional): Filter by process
    - `document_type_id` (uuid, optional): Filter by document type
    - `rule_type` (string, optional): Filter by type
    - `is_active` (boolean, optional): Filter by active status
  - **Response:** Array of rule objects

#### Get Rule Details
- **GET /api/rules/{rule_id}**
  - **Access:** Administrator only
  - **Response:** Complete rule object

#### Update Rule
- **PATCH /api/rules/{rule_id}**
  - **Access:** Administrator only
  - **Request Fields:** (all optional, same as create)
  - **Response:** Updated rule object

#### Test Rule
- **POST /api/rules/{rule_id}/test**
  - **Access:** Administrator only
  - **Request Fields:**
    - `dossier_id` (uuid, optional): Test against specific dossier
    - `test_data` (object, optional): Test data object
  - **Response Fields:**
    - `rule_id` (uuid): Rule ID
    - `rule_code` (string): Rule code
    - `rule_name` (string): Rule name
    - `passed` (boolean): Whether test passed
    - `status` (string): Test status
    - `message` (string): Result message

#### Toggle Rule
- **POST /api/rules/{rule_id}/toggle**
  - **Access:** Administrator only
  - **Response:** Rule object with toggled `is_active` status

#### Delete Rule
- **DELETE /api/rules/{rule_id}**
  - **Access:** Administrator only
  - **Response:** Success message

---

### Schema Management

#### Create Schema
- **POST /api/schemas**
  - **Access:** Administrator only
  - **Request Fields:**
    - `document_type_id` (uuid, required): Associated document type
    - `field_name` (string, required): Field identifier
    - `display_name` (string, required): Human-readable name
    - `description` (string, optional): Field description
    - `data_type` (string, required): Data type (string, number, date, etc.)
    - `is_required` (boolean, optional): Whether field is required
    - `validation_pattern` (string, optional): Regex validation pattern
    - `extraction_hints` (object, optional): AI extraction hints
    - `default_value` (object, optional): Default value
    - `display_order` (integer, optional): Display order
    - `is_active` (boolean, optional): Active status
  - **Response:** Created schema object

#### List Schemas
- **GET /api/schemas**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `document_type_id` (uuid, optional): Filter by document type
    - `is_active` (boolean, optional): Filter by active status
  - **Response:** Array of schema objects

#### Get Schema Details
- **GET /api/schemas/{schema_id}**
  - **Access:** Administrator only
  - **Response:** Complete schema object

#### Get Schema Fields
- **GET /api/schemas/{schema_id}/fields**
  - **Access:** Authenticated users
  - **Response Fields:**
    - `schema_id` (uuid): Schema ID
    - `fields` (array): List of field definitions
    - `total` (integer): Total field count

#### Update Schema
- **PATCH /api/schemas/{schema_id}**
  - **Access:** Administrator only
  - **Request Fields:** (all optional, same as create)
  - **Response:** Updated schema object

#### Delete Schema
- **DELETE /api/schemas/{schema_id}**
  - **Access:** Administrator only
  - **Response:** Success message

---

### Feedback Management

#### Submit Feedback
- **POST /api/feedback**
  - **Access:** Validator only
  - **Request Fields:**
    - `dossier_id` (uuid, optional): Associated dossier
    - `document_id` (uuid, optional): Associated document
    - `field_id` (uuid, optional): Associated field
    - `feedback_type` (string, required): Type (correction, improvement, error)
    - `feedback_text` (string, required): Feedback description
    - `suggested_value` (string, optional): Suggested correction
    - `is_used_for_training` (boolean, optional): Training data flag
  - **Response:** Created feedback object

#### List Feedback
- **GET /api/feedback**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `dossier_id` (uuid, optional): Filter by dossier
    - `feedback_type` (string, optional): Filter by type
    - `used_for_training` (boolean, optional): Filter by training flag
    - `page` (integer, optional): Page number
    - `limit` (integer, optional): Results per page
  - **Response Fields:**
    - `feedback` (array): List of feedback objects
    - `total` (integer): Total count
    - `page` (integer): Current page
    - `limit` (integer): Page size

#### Get Feedback Details
- **GET /api/feedback/{feedback_id}**
  - **Access:** Administrator, Validator
  - **Response:** Complete feedback object with all details

#### Get Feedback Statistics
- **GET /api/feedback/stats**
  - **Access:** Administrator only
  - **Response Fields:**
    - `total` (integer): Total feedback count
    - `by_type` (object): Count by feedback type
    - `used_for_training` (integer): Count used for training
    - `not_used_for_training` (integer): Count not used
    - `avg_confidence_before` (number): Average confidence before correction

#### Export Feedback
- **POST /api/feedback/export**
  - **Access:** Administrator only
  - **Request Fields:**
    - `format` (string, optional): Export format (json, csv)
    - `used_for_training_only` (boolean, optional): Only training data
  - **Response:** Export data or file download

---

### Billing Management

#### Get Billing Summary
- **GET /api/billing/summary**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `date_from` (date, optional): Start date filter
    - `date_to` (date, optional): End date filter
  - **Response Fields:**
    - `total_invoices` (integer): Total invoice count
    - `total_amount` (number): Total amount
    - `paid_amount` (number): Paid amount
    - `pending_amount` (number): Pending amount
    - `invoices` (array): List of invoice summaries

#### List Billable Dossiers
- **GET /api/billing/dossiers**
  - **Access:** Administrator, Validator
  - **Query Parameters:**
    - `page` (integer, optional): Page number
    - `page_size` (integer, optional): Results per page
    - `status` (string, optional): Filter by status
    - `installer_id` (uuid, optional): Filter by installer
  - **Response Fields:**
    - `items` (array): List of billable dossiers
    - `total` (integer): Total count
    - `page` (integer): Current page
    - `page_size` (integer): Page size
    - `total_pages` (integer): Total pages

#### Generate Invoice
- **POST /api/billing/dossiers/{dossier_id}/invoice**
  - **Access:** Administrator only
  - **Request Fields:**
    - `kwh_cumac` (number, optional): kWh CUMAC value
    - `price_per_kwh` (number, optional): Price per kWh
    - `payment_on_validation` (number, optional): Payment on validation
    - `payment_on_emmy` (number, optional): Payment on EMMY
    - `due_date` (date, optional): Invoice due date
  - **Response:** Created invoice object with all details

#### Record Payment
- **POST /api/billing/dossiers/{dossier_id}/payment**
  - **Access:** Administrator only
  - **Request Fields:**
    - `amount` (number, optional): Payment amount
    - `payment_reference` (string, optional): Payment reference number
    - `payment_method` (string, optional): Payment method
  - **Response:** Updated invoice with payment information

#### List Invoices
- **GET /api/billing/invoices**
  - **Access:** Administrator, Validator
  - **Query Parameters:**
    - `page` (integer, optional): Page number
    - `page_size` (integer, optional): Results per page
    - `status` (string, optional): Filter by status
    - `installer_id` (uuid, optional): Filter by installer
  - **Response:** Paginated list of invoices

#### Get Invoice Details
- **GET /api/billing/invoices/{invoice_id}**
  - **Access:** Administrator, Validator
  - **Response:** Complete invoice object with all fields

---

### Analytics Endpoints

#### Get Dashboard Metrics
- **GET /api/analytics/dashboard**
  - **Access:** Administrator, Validator
  - **Query Parameters:**
    - `date_from` (date, optional): Start date
    - `date_to` (date, optional): End date
  - **Response Fields:**
    - `dossiers` (object): Dossier statistics
      - `total`, `by_status`, `submitted_today`, `validated_today`, `avg_processing_time`
    - `validation` (object): Validation statistics
      - `pending_review`, `avg_confidence`, `correction_rate`, `override_rate`
    - `performance` (object): Performance metrics
      - `avg_validation_time`, `dossiers_per_validator`, `ai_model_accuracy`

#### Get Validation Statistics
- **GET /api/analytics/validation**
  - **Access:** Administrator, Validator
  - **Query Parameters:**
    - `date_from` (date, optional): Start date
    - `date_to` (date, optional): End date
  - **Response Fields:**
    - `dossiers` (object): Dossier stats (total, approved, rejected, in_review, approval_rate)
    - `fields` (object): Field stats (total, confirmed, corrected, unreviewed, avg_confidence)
    - `validation_rules` (object): Rule stats (total, passed, failed, overridden, override_rate)

#### Get Processing Metrics
- **GET /api/analytics/processing**
  - **Access:** Administrator, Validator
  - **Query Parameters:**
    - `date_from` (date, optional): Start date
    - `date_to` (date, optional): End date
  - **Response Fields:**
    - `dossiers` (object): Processing times (total, avg, min, max)
    - `documents` (object): Document stats (total, pending, processing, completed, failed, success_rate)

#### Get Model Performance
- **GET /api/analytics/model-performance**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `model_name` (string, optional): Filter by model
    - `task_type` (string, optional): Filter by task type
    - `date_from` (date, optional): Start date
    - `date_to` (date, optional): End date
  - **Response Fields:**
    - `models` (array): Model performance data
    - `total_metrics` (integer): Total metric count

---

### Activity Logging

#### List Activities
- **GET /api/activity**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `user_id` (uuid, optional): Filter by user
    - `entity_type` (string, optional): Filter by entity type
    - `entity_id` (uuid, optional): Filter by entity ID
    - `action_types` (string, optional): Comma-separated action types
    - `date_from` (datetime, optional): Start date
    - `date_to` (datetime, optional): End date
    - `page` (integer, optional): Page number
    - `limit` (integer, optional): Results per page
  - **Response Fields:**
    - `activities` (array): List of activity log entries
    - `total` (integer): Total count
    - `page` (integer): Current page
    - `limit` (integer): Page size

#### Get Activity Details
- **GET /api/activity/{activity_id}**
  - **Access:** Administrator only
  - **Response:** Complete activity log entry with all details

---

### Search Endpoints

#### Global Search
- **GET /api/search**
  - **Access:** Authenticated users
  - **Query Parameters:**
    - `q` (string, required): Search query (min 1 character)
  - **Response:** Search results across dossiers, documents, and installers

#### Search Dossiers
- **GET /api/search/dossiers**
  - **Access:** Authenticated users
  - **Query Parameters:**
    - `q` (string, required): Search query
    - `status` (string, optional): Filter by status
    - `process_code` (string, optional): Filter by process code
    - `page` (integer, optional): Page number
    - `per_page` (integer, optional): Results per page
  - **Response:** Paginated dossier search results

#### Search Documents
- **GET /api/search/documents**
  - **Access:** Authenticated users
  - **Query Parameters:**
    - `q` (string, required): Search query
    - `page` (integer, optional): Page number
    - `per_page` (integer, optional): Results per page
  - **Response:** Paginated document search results

#### Search Installers
- **GET /api/search/installers**
  - **Access:** Authenticated users
  - **Query Parameters:**
    - `q` (string, required): Search query
    - `page` (integer, optional): Page number
    - `per_page` (integer, optional): Results per page
  - **Response:** Paginated installer search results

---

### AI Configuration

#### Get AI Config
- **GET /api/ai/config**
  - **Access:** Administrator only
  - **Response Fields:**
    - `configurations` (array): List of active AI configurations

#### List AI Providers
- **GET /api/ai/providers**
  - **Access:** Administrator only
  - **Response Fields:**
    - `providers` (array): List of AI providers with configurations
    - `total` (integer): Total provider count

#### List AI Models
- **GET /api/ai/models**
  - **Access:** Administrator only
  - **Query Parameters:**
    - `provider` (string, optional): Filter by provider
  - **Response Fields:**
    - `models_by_provider` (object): Models grouped by provider
    - `total_models` (integer): Total model count

#### Update AI Config
- **PATCH /api/ai/config**
  - **Access:** Administrator only
  - **Request Fields:**
    - `config_key` (string, optional): Configuration key
    - `provider` (string, optional): AI provider name
    - `model_name` (string, optional): Model name
    - `model_version` (string, optional): Model version
    - `api_endpoint` (string, optional): API endpoint URL
    - `api_key_encrypted` (string, optional): Encrypted API key
    - `parameters` (object, optional): Model parameters
    - `is_active` (boolean, optional): Active status
    - `priority` (integer, optional): Priority order
  - **Response:** Updated configuration object

#### Test AI Provider
- **POST /api/ai/providers/{provider_id}/test**
  - **Access:** Administrator only
  - **Request Fields:**
    - `test_input` (string, optional): Test input data
  - **Response Fields:**
    - `success` (boolean): Test success status
    - `message` (string): Test result message
    - `provider` (string): Provider name
    - `model` (string): Model name
    - `has_api_key` (boolean): Whether API key is configured
    - `has_endpoint` (boolean): Whether endpoint is configured

---

## Data Models & Field Explanations

### User Model
- **id** (uuid): Unique user identifier
- **email** (string): Login email address (unique)
- **name** (string): User's full name
- **role** (enum): User role (administrator, validator, installer)
- **active** (boolean): Whether account is active
- **last_login** (datetime): Last login timestamp
- **created_at**, **updated_at** (datetime): Timestamps

### Installer Model
- **id** (uuid): Installer record ID
- **user_id** (uuid): Associated user account ID (one-to-one)
- **company_name** (string): Company name
- **siret** (string, 14 chars): French company registration number (unique)
- **siren** (string, 9 chars): French company identifier
- **address**, **city**, **postal_code** (string): Company address
- **contact_name**, **contact_email**, **contact_phone** (string): Contact information
- **rge_number** (string): RGE certification number
- **rge_status** (string): RGE verification status
- **qualifications** (array): List of qualifications
- **active** (boolean): Account active status
- **created_at**, **updated_at** (datetime): Timestamps

### Validator Model
- **id** (uuid): Validator record ID
- **user_id** (uuid): Associated user account ID (one-to-one)
- **employee_id** (string): Employee identifier (unique, auto-generated if not provided)
- **department** (string): Department name
- **specialization** (string): Area of specialization
- **certifications** (array): List of certifications
- **max_concurrent_dossiers** (integer): Maximum dossiers validator can handle simultaneously
- **validation_stats** (object): Validation statistics (dossiers_validated, accuracy, etc.)
- **notes** (string): Additional notes
- **active** (boolean): Account active status
- **created_at**, **updated_at** (datetime): Timestamps

### Dossier Model
- **id** (uuid): Dossier unique identifier
- **reference** (string): Auto-generated dossier reference number (unique)
- **process_id** (uuid): Associated process type
- **installer_id** (uuid): Associated installer
- **assigned_validator_id** (uuid): Assigned validator (nullable)
- **status** (enum): Current status
  - `draft`: Being created
  - `submitted`: Submitted for validation
  - `awaiting_review`: Waiting for validator assignment
  - `in_review`: Under validation
  - `approved`: Validation approved
  - `rejected`: Validation rejected
  - `archived`: Archived
- **priority** (enum): Priority level (low, normal, high, urgent)
- **beneficiary_name**, **beneficiary_address**, **beneficiary_city**, **beneficiary_postal_code** (string): Beneficiary address
- **beneficiary_email**, **beneficiary_phone** (string): Beneficiary contact
- **precarity_status** (boolean): Precarity indicator
- **submitted_at**, **validated_at**, **approved_at** (datetime): Status change timestamps
- **processing_time_ms** (integer): Processing time in milliseconds
- **created_at**, **updated_at** (datetime): Timestamps

### Document Model
- **id** (uuid): Document unique identifier
- **dossier_id** (uuid): Parent dossier ID
- **document_type_id** (uuid): Document type classification
- **filename** (string): Stored filename
- **original_filename** (string): Original upload filename
- **file_size** (integer): File size in bytes
- **mime_type** (string): MIME type (e.g., "application/pdf")
- **storage_path** (string): File storage path
- **processing_status** (enum): Processing status
  - `pending`: Waiting for processing
  - `processing`: Currently processing
  - `completed`: Processing complete
  - `failed`: Processing failed
- **classification_confidence** (number): AI classification confidence (0-1)
- **processing_time_ms** (integer): Processing time in milliseconds
- **uploaded_at**, **processed_at** (datetime): Timestamps

### Extracted Field Model
- **id** (uuid): Field unique identifier
- **dossier_id** (uuid): Parent dossier ID
- **document_id** (uuid): Source document ID
- **field_name** (string): Field identifier (matches schema)
- **display_name** (string): Human-readable field name
- **extracted_value** (object): Original AI-extracted value
- **corrected_value** (object): Validator-corrected value
- **status** (enum): Field status
  - `unreviewed`: Not yet reviewed
  - `confirmed`: Validator confirmed as correct
  - `corrected`: Validator corrected the value
- **confidence** (number): AI confidence score (0-1)
- **confirmed_at** (datetime): Confirmation timestamp
- **confirmed_by** (uuid): Validator user ID who confirmed
- **created_at**, **updated_at** (datetime): Timestamps

### Validation Rule Model
- **id** (uuid): Rule unique identifier
- **code** (string): Rule code (unique identifier)
- **name** (string): Rule name
- **description** (string): Rule description
- **process_id** (uuid): Associated process (nullable)
- **document_type_id** (uuid): Associated document type (nullable)
- **rule_type** (enum): Rule type
  - `document`: Validates within single document
  - `cross_document`: Validates across multiple documents
  - `business`: Business logic validation
- **severity** (enum): Severity level (error, warning, info)
- **expression** (string): Validation expression/logic
- **error_message** (string): Error message when rule fails
- **can_override** (boolean): Whether rule can be overridden
- **is_active** (boolean): Active status
- **version** (integer): Rule version number
- **created_by** (uuid): Creator user ID
- **created_at**, **updated_at** (datetime): Timestamps

### Validation Result Model
- **id** (uuid): Result unique identifier
- **dossier_id** (uuid): Associated dossier
- **rule_id** (uuid): Associated validation rule
- **passed** (boolean): Whether rule passed
- **status** (string): Result status (passed, error, warning)
- **message** (string): Result message
- **affected_fields** (array): List of affected field names
- **overridden** (boolean): Whether rule was overridden
- **override_reason** (string): Override reason (if overridden)
- **executed_at** (datetime): Execution timestamp

### Field Schema Model
- **id** (uuid): Schema unique identifier
- **document_type_id** (uuid): Associated document type
- **field_name** (string): Field identifier (unique per document type)
- **display_name** (string): Human-readable field name
- **description** (string): Field description
- **data_type** (string): Data type (string, number, date, boolean, object, array)
- **is_required** (boolean): Whether field is required
- **validation_pattern** (string): Regex validation pattern
- **extraction_hints** (object): AI extraction hints/guidance
- **default_value** (object): Default value
- **display_order** (integer): Display order in UI
- **is_active** (boolean): Active status
- **created_at**, **updated_at** (datetime): Timestamps

### Process Model
- **id** (uuid): Process unique identifier
- **code** (string): Process code (unique)
- **name** (string): Process name
- **description** (string): Process description
- **category** (string): Process category
- **version** (string): Version number
- **is_active** (boolean): Active status
- **is_system** (boolean): System process flag
- **is_coup_de_pouce** (boolean): Coup de pouce indicator
- **valid_from**, **valid_until** (date): Validity period
- **required_documents** (array): List of required document types
- **metadata** (object): Additional metadata
- **created_at**, **updated_at** (datetime): Timestamps

### Invoice Model
- **id** (uuid): Invoice unique identifier
- **invoice_number** (string): Auto-generated invoice number (unique)
- **dossier_id** (uuid): Associated dossier
- **installer_id** (uuid): Associated installer
- **status** (string): Invoice status (pending, paid, cancelled)
- **kwh_cumac** (number): kWh CUMAC value
- **price_per_kwh** (number): Price per kWh
- **total_amount** (number): Total invoice amount
- **payment_on_validation** (number): Payment on validation
- **payment_on_emmy** (number): Payment on EMMY
- **due_date** (date): Invoice due date
- **paid_at** (datetime): Payment timestamp
- **payment_reference** (string): Payment reference number
- **payment_method** (string): Payment method
- **pdf_path** (string): Generated PDF path
- **created_at**, **updated_at** (datetime): Timestamps

### Human Feedback Model
- **id** (uuid): Feedback unique identifier
- **validator_id** (uuid): Validator who provided feedback
- **dossier_id** (uuid): Associated dossier (nullable)
- **document_id** (uuid): Associated document (nullable)
- **extracted_field_id** (uuid): Associated field (nullable)
- **feedback_type** (enum): Feedback type (correction, improvement, error)
- **original_value** (string): Original AI-extracted value
- **corrected_value** (string): Corrected value
- **field_name** (string): Field identifier
- **document_type** (string): Document type
- **context_data** (object): Additional context
- **model_used** (string): AI model used
- **model_version** (string): Model version
- **confidence_before** (number): Confidence before correction
- **notes** (string): Additional notes
- **used_for_training** (boolean): Whether used for model training
- **training_batch_id** (uuid): Training batch ID (nullable)
- **created_at** (datetime): Creation timestamp

### Activity Log Model
- **id** (uuid): Activity log unique identifier
- **user_id** (uuid): User who performed action
- **action_type** (string): Action type (e.g., "dossier.created", "document.uploaded")
- **entity_type** (string): Entity type (dossier, document, user, etc.)
- **entity_id** (uuid): Entity ID
- **entity_reference** (string): Entity reference (e.g., dossier reference)
- **description** (string): Human-readable description
- **meta_data** (object): Additional metadata
- **ip_address** (string): User IP address
- **user_agent** (string): User agent string
- **duration_ms** (integer): Action duration in milliseconds
- **created_at** (datetime): Timestamp

---

## Common Patterns

### Pagination
Most list endpoints support pagination:
- **Query Parameters:**
  - `page` (integer): Page number (starts at 1)
  - `limit` or `page_size` (integer): Results per page
- **Response Fields:**
  - `items` or array name: List of items
  - `total` (integer): Total count
  - `page` (integer): Current page
  - `limit` or `page_size` (integer): Page size
  - `total_pages` (integer): Total number of pages

### Filtering
Many endpoints support filtering via query parameters:
- **Common Filters:**
  - `status`: Filter by status
  - `is_active`: Filter by active status (boolean)
  - `date_from`, `date_to`: Date range filters
  - Entity IDs: Filter by related entity (e.g., `installer_id`, `process_id`)

### Error Responses
All endpoints return consistent error responses:
- **400 Bad Request:** Invalid input data
  - `{"detail": "Error message"}`
- **401 Unauthorized:** Missing or invalid authentication
  - `{"detail": "Could not validate credentials"}`
- **403 Forbidden:** Insufficient permissions
  - `{"detail": "Requires one of: [roles]"}`
- **404 Not Found:** Resource not found
  - `{"detail": "Resource not found"}`
- **500 Internal Server Error:** Server error
  - `{"detail": "Internal server error"}`

### Status Enums

#### Dossier Status
- `draft`: Being created
- `submitted`: Submitted for validation
- `awaiting_review`: Waiting for validator assignment
- `in_review`: Under validation
- `approved`: Validation approved
- `rejected`: Validation rejected
- `archived`: Archived

#### Document Processing Status
- `pending`: Waiting for processing
- `processing`: Currently processing
- `completed`: Processing complete
- `failed`: Processing failed

#### Field Status
- `unreviewed`: Not yet reviewed
- `confirmed`: Validator confirmed as correct
- `corrected`: Validator corrected the value

#### Priority Levels
- `low`: Low priority
- `normal`: Normal priority
- `high`: High priority
- `urgent`: Urgent priority

### Date/Time Formats
- **Date:** ISO 8601 format (YYYY-MM-DD)
- **DateTime:** ISO 8601 format with timezone (YYYY-MM-DDTHH:MM:SS+00:00)
- **Examples:**
  - Date: `2024-01-15`
  - DateTime: `2024-01-15T10:30:00Z` or `2024-01-15T10:30:00+00:00`

### UUID Format
All IDs are UUIDs (Universally Unique Identifiers) in the format:
- Example: `550e8400-e29b-41d4-a716-446655440000`
- Always sent and received as strings

---

## Frontend Integration Tips

### Authentication Flow
1. Store `access_token` in secure storage (localStorage or secure cookie)
2. Include in all requests: `Authorization: Bearer {token}`
3. Handle 401 responses by redirecting to login
4. Implement token refresh before expiration

### File Uploads
- Use `multipart/form-data` for document uploads
- Include `file` field with the actual file
- Optionally include `document_type_id` for classification
- Show upload progress and processing status

### Real-time Updates
- Poll dossier status endpoints for updates
- Show processing status for documents
- Update validation state when fields are confirmed/corrected

### Error Handling
- Display user-friendly error messages from `detail` field
- Handle validation errors (400) by showing field-specific errors
- Handle authentication errors (401) by redirecting to login
- Handle permission errors (403) by showing appropriate message

### Data Display
- Use `display_name` from schemas for user-facing labels
- Show confidence scores for extracted fields
- Display status badges with appropriate colors
- Format dates/times according to user locale

---

## API Documentation Access

- **Swagger UI:** `http://localhost:8000/docs` or `https://veloren-dev.heyzack.ai/docs`
- **OpenAPI JSON:** `http://localhost:8000/api/openapi.json`
- **Steps Discovery:** `http://localhost:8000/api/steps`
- **Database Studio:** `http://localhost:8000/api/db/studio` (Administrator only)
- **Database Schema:** `http://localhost:8000/api/docs/database-schema` (Administrator only)

---

## Support & Questions

For API questions or issues, refer to:
- Swagger UI for interactive API testing
- This documentation for field explanations
- OpenAPI JSON spec for complete schema definitions

