'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Code } from 'lucide-react';
import { FieldSchema, DocumentType } from '@/lib/mock-data/document-types';

interface JSONSchemaViewerProps {
  documentType: DocumentType;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export function JSONSchemaViewer({ documentType, isExpanded = false, onToggleExpanded }: JSONSchemaViewerProps) {
  // Convert FieldSchema to JSON Schema format
  const generateJSONSchema = () => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    documentType.fieldSchema.forEach((field) => {
      const schemaField: any = {
        type: getJSONSchemaType(field.dataType),
        description: field.displayName,
      };

      // Add field-specific properties
      if (field.dataType === 'enum' && field.enumValues) {
        schemaField.enum = field.enumValues;
      }

      if (field.maxLength) {
        schemaField.maxLength = field.maxLength;
      }

      if (field.minValue !== undefined || field.maxValue !== undefined) {
        schemaField.minimum = field.minValue;
        schemaField.maximum = field.maxValue;
      }

      if (field.validationRegex) {
        schemaField.pattern = field.validationRegex;
      }

      // Add extraction hints for OCR models
      if (field.extractionHints.length > 0) {
        schemaField.extractionHints = field.extractionHints;
        schemaField.description += ` (Keywords: ${field.extractionHints.join(', ')})`;
      }

      // Add confidence threshold
      schemaField.confidenceThreshold = field.confidenceThreshold;

      // Add post-processing instructions
      if (Object.keys(field.postProcessing).length > 0) {
        schemaField.postProcessing = field.postProcessing;
      }

      properties[field.internalName] = schemaField;

      if (field.required) {
        required.push(field.internalName);
      }
    });

    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: `${documentType.name} Extraction Schema`,
      description: `Schema for extracting structured data from ${documentType.name} documents using OCR models like Mistral OCR and Gemini 2.5 Pro`,
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false,
    };
  };

  const getJSONSchemaType = (dataType: string): string => {
    const typeMap: Record<string, string> = {
      string: 'string',
      integer: 'integer',
      decimal: 'number',
      currency: 'number',
      date: 'string',
      boolean: 'boolean',
      email: 'string',
      phone: 'string',
      address: 'string',
      enum: 'string',
      signature: 'boolean',
    };
    return typeMap[dataType] || 'string';
  };

  const jsonSchema = generateJSONSchema();
  const jsonString = JSON.stringify(jsonSchema, null, 2);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              OCR JSON Schema
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              JSON Schema for Mistral OCR, Gemini 2.5 Pro, and other OCR models
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {documentType.fieldSchema.length} fields
            </Badge>
            <Badge variant="outline">
              {documentType.fieldSchema.filter(f => f.required).length} required
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Schema Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{documentType.fieldSchema.length}</div>
              <div className="text-sm text-muted-foreground">Total Fields</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {documentType.fieldSchema.filter(f => f.required).length}
              </div>
              <div className="text-sm text-muted-foreground">Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {documentType.fieldSchema.filter(f => f.dataType === 'currency').length}
              </div>
              <div className="text-sm text-muted-foreground">Currency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {documentType.fieldSchema.filter(f => f.dataType === 'date').length}
              </div>
              <div className="text-sm text-muted-foreground">Dates</div>
            </div>
          </div>

          {/* Field Types Breakdown */}
          <div className="space-y-2">
            <h4 className="font-medium">Field Types:</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(documentType.fieldSchema.map(f => f.dataType))).map(dataType => (
                <Badge key={dataType} variant="secondary">
                  {dataType} ({documentType.fieldSchema.filter(f => f.dataType === dataType).length})
                </Badge>
              ))}
            </div>
          </div>

          {/* JSON Schema Display */}
          <div className="space-y-2">
            <h4 className="font-medium">Generated JSON Schema:</h4>
            <div className="relative">
              <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto text-sm border">
                <code>{jsonString}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
