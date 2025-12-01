# OCR Schema Design for Document Extraction

## Overview

This document type configuration system is specifically designed to generate JSON schemas for OCR models like Mistral OCR, Gemini 2.5 Pro, Azure Document Intelligence, and Google Document AI.

## Architecture

### 1. Field Schema Definition

The `FieldSchema` type defines each field to be extracted:

```typescript
export type FieldSchema = {
  id: string;                    // Unique field identifier
  internalName: string;          // JSON field name (e.g., "quote_number")
  displayName: string;           // Human-readable name (e.g., "Numéro de devis")
  dataType: FieldDataType;       // Data type (string, currency, date, etc.)
  required: boolean;             // Whether field is required
  extractionHints: string[];     // OCR keywords for field location
  postProcessing: {              // Data cleaning rules
    uppercase?: boolean;
    lowercase?: boolean;
    trimWhitespace?: boolean;
    removeSpecialChars?: boolean;
  };
  confidenceThreshold: number;   // Minimum OCR confidence (0-100)
  fieldGroup?: string;           // Logical grouping (e.g., "Financial")
  crossReferenceFields?: string[]; // Related fields for validation
  validationRegex?: string;       // Pattern validation
  maxLength?: number;            // Max string length
  minValue?: number;             // Numeric min value
  maxValue?: number;             // Numeric max value
  enumValues?: string[];         // For enum type fields
};
```

### 2. JSON Schema Generation

The system converts field definitions into standard JSON Schema format:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "title": "Devis Extraction Schema",
  "description": "Schema for extracting structured data from Devis documents using OCR models like Mistral OCR and Gemini 2.5 Pro",
  "properties": {
    "quote_number": {
      "type": "string",
      "description": "Numéro de devis (Keywords: devis, n°, numéro)",
      "confidenceThreshold": 85
    },
    "prime_cee": {
      "type": "number",
      "description": "Prime CEE (Keywords: prime cee, prime énergie, aide cee)",
      "minimum": 0,
      "maximum": 100000,
      "confidenceThreshold": 90
    }
  },
  "required": ["quote_number", "prime_cee"],
  "additionalProperties": false
}
```

## OCR Model Integration

### Mistral OCR

```python
import mistral_ocr

# Use generated schema
schema = {
    "type": "object",
    "properties": {
        "quote_number": {"type": "string", "description": "Quote number"},
        "prime_cee": {"type": "number", "description": "CEE Prime amount"}
    },
    "required": ["quote_number", "prime_cee"]
}

ocr = mistral_ocr.Client(api_key="your-api-key")
result = ocr.process_document(
    file_path="devis.pdf",
    schema=schema
)
```

### Gemini 2.5 Pro

```python
import google.generativeai as genai

model = genai.GenerativeModel('gemini-2.0-flash-exp')
prompt = f"""
Extract structured data from this document according to this JSON Schema:
{json.dumps(schema, indent=2)}

Document: [image or text]
"""

response = model.generate_content(prompt)
result = json.loads(response.text)
```

### Azure Document Intelligence

```python
from azure.ai.formrecognizer import DocumentAnalysisClient

client = DocumentAnalysisClient(endpoint=endpoint, credential=credential)
with open("devis.pdf", "rb") as f:
    poller = client.begin_analyze_document(
        model_id="prebuilt-document",
        document=f
    )
result = poller.result()
```

## Field Definition Best Practices

### 1. Extraction Hints

Extraction hints are crucial for OCR accuracy. They provide context about where to find specific information:

```typescript
// Good examples
extractionHints: ['devis', 'n°', 'numéro', 'quote', 'reference']  // Quote number
extractionHints: ['montant', 'total', '€', 'euro', 'prime']        // Amount
extractionHints: ['date', 'le', 'issued', 'created', 'fait le']   // Date
```

### 2. Confidence Thresholds

Set appropriate thresholds based on field importance:

- **Critical fields**: 90-95% (amounts, dates, references)
- **Important fields**: 85-90% (names, addresses)
- **Optional fields**: 75-85% (descriptions, notes)

### 3. Data Types

Use specific data types for better extraction:

```typescript
'date'      // Automatic date parsing
'currency'  // Currency amount extraction
'email'     // Email format validation
'phone'     // Phone number format
'address'   // Address parsing
'enum'      // Limited value options
```

### 4. Field Grouping

Group related fields for better context:

```typescript
fieldGroup: 'Identification'  // Quote number, date, reference
fieldGroup: 'Financial'       // Amounts, taxes, totals
fieldGroup: 'Technical'       // Equipment, models, brands
```

## Advanced Features

### 1. Cross-Field Validation

Define relationships between fields:

```typescript
crossReferenceFields: ['facture.prime_cee', 'cdc.prime_montant']
```

### 2. Post-Processing

Clean extracted data automatically:

```typescript
postProcessing: {
  uppercase: true,        // Convert to uppercase
  trimWhitespace: true,   // Remove extra spaces
  removeSpecialChars: true  // Remove special characters
}
```

### 3. Validation Rules

Add validation constraints:

```typescript
validationRegex: '^[A-Z0-9-]+$',  // Quote number format
minValue: 0,                       // Minimum amount
maxLength: 50,                     // Max string length
enumValues: ['OUI', 'NON'],        // Enum options
```

## Implementation Workflow

1. **Define Document Type**
   - Create document type with basic info
   - Set classification hints for document identification

2. **Add Fields**
   - Define each field with type and extraction hints
   - Set confidence thresholds and validation rules
   - Group related fields

3. **Generate Schema**
   - System automatically creates JSON Schema
   - Schema includes OCR-specific metadata
   - Compatible with major OCR models

4. **Test Integration**
   - Use built-in OCR demo to test extraction
   - Validate field accuracy and confidence
   - Optimize extraction hints based on results

5. **Deploy to Production**
   - Export schema for OCR model integration
   - Configure confidence thresholds
   - Set up cross-field validation

## Schema Export Formats

### JSON Schema (Standard)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {...},
  "required": [...]
}
```

### Python Integration
```python
# Generated automatically
schema = generate_schema(document_type)
result = mistral_ocr.process(file_path, schema)
```

### API Format
```json
{
  "documentType": "DEVIS",
  "schema": {...},
  "ocrModel": "mistral",
  "confidence": 85
}
```

## Performance Optimization

1. **Field Order**: Place important fields first
2. **Extraction Hints**: Use 3-5 specific keywords per field
3. **Confidence Thresholds**: Balance accuracy vs. completeness
4. **Field Groups**: Group related fields for context
5. **Validation**: Add validation rules to improve data quality

## Troubleshooting

### Low Extraction Accuracy
- Add more specific extraction hints
- Increase confidence thresholds
- Improve field descriptions
- Group related fields

### Missing Required Fields
- Lower confidence thresholds temporarily
- Add alternative keywords
- Check document layout variations
- Consider field location hints

### OCR Model Compatibility
- Ensure schema follows JSON Schema standard
- Test with different OCR models
- Adjust field descriptions for model capabilities
- Validate data type mappings

This system provides a comprehensive solution for creating OCR-ready schemas that work seamlessly with modern document extraction models.
