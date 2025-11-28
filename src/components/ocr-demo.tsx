'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code, Play, Copy, CheckCircle } from 'lucide-react';
import { DocumentType, FieldSchema } from '@/lib/mock-data/document-types';

interface OCRDemoProps {
  documentType: DocumentType;
}

export function OCRDemo({ documentType }: OCRDemoProps) {
  const [copied, setCopied] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  // Generate mock OCR result based on field schema
  const generateMockOCRResult = () => {
    const mockResult: any = {};
    
    documentType.fieldSchema.forEach(field => {
      switch (field.dataType) {
        case 'string':
          mockResult[field.internalName] = `Extracted ${field.displayName}`;
          break;
        case 'currency':
          mockResult[field.internalName] = Math.floor(Math.random() * 10000) + 100;
          break;
        case 'date':
          mockResult[field.internalName] = new Date().toISOString().split('T')[0];
          break;
        case 'integer':
          mockResult[field.internalName] = Math.floor(Math.random() * 100);
          break;
        case 'boolean':
          mockResult[field.internalName] = Math.random() > 0.5;
          break;
        case 'email':
          mockResult[field.internalName] = 'extracted@example.com';
          break;
        case 'phone':
          mockResult[field.internalName] = '+33 1 23 45 67 89';
          break;
        case 'address':
          mockResult[field.internalName] = '123 Rue de la République, 75001 Paris';
          break;
        default:
          mockResult[field.internalName] = 'Sample value';
      }
    });

    return mockResult;
  };

  const handleRunOCR = async () => {
    setIsRunning(true);
    setResult(null);
    
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResult = generateMockOCRResult();
    setResult(mockResult);
    setIsRunning(false);
  };

  const generatePythonCode = () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: Object.fromEntries(
        documentType.fieldSchema.map(field => [
          field.internalName,
          {
            type: field.dataType === 'currency' ? 'number' : field.dataType,
            description: field.displayName,
          }
        ])
      ),
      required: documentType.fieldSchema.filter(f => f.required).map(f => f.internalName),
    }, null, 2);

    return `# Mistral OCR Example
import mistral_ocr

# Generated JSON Schema for ${documentType.name}
schema = ${schema}

# Initialize Mistral OCR
ocr = mistral_ocr.Client(api_key="your-api-key")

# Process document
result = ocr.process_document(
    file_path="path/to/${documentType.code.toLowerCase()}.pdf",
    schema=schema
)

print("Extracted data:")
print(result)`;
  };

  const handleCopyCode = async () => {
    const code = generatePythonCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          OCR Model Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test how your schema works with OCR models like Mistral OCR and Gemini 2.5 Pro
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* OCR Model Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Mistral OCR', 'Gemini 2.5 Pro', 'Azure Document AI', 'Google Document AI'].map((model) => (
            <div key={model} className="p-3 border rounded-lg text-center">
              <div className="font-medium text-sm">{model}</div>
              <Badge variant="outline" className="mt-1 text-xs">Compatible</Badge>
            </div>
          ))}
        </div>

        {/* Demo Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={handleRunOCR} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Processing...' : 'Run OCR Demo'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCopyCode}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Python Code'}
          </Button>
        </div>

        {/* Processing Status */}
        {isRunning && (
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm">Processing document with OCR model...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium">Extraction Results</h4>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(result).length} fields extracted
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Extracted Data:</h5>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded border">
                  <pre className="text-sm overflow-auto">
                    <code>{JSON.stringify(result, null, 2)}</code>
                  </pre>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-sm mb-2">Field Validation:</h5>
                <div className="space-y-2">
                  {documentType.fieldSchema.map(field => {
                    const value = result[field.internalName];
                    const isValid = value !== undefined && value !== null;
                    
                    return (
                      <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm">{field.displayName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{value || 'Not found'}</div>
                          {field.required && !isValid && (
                            <div className="text-xs text-red-600">Required field missing</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Code Example */}
        <div className="space-y-2">
          <h4 className="font-medium">Python Integration Example:</h4>
          <div className="relative">
            <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto text-sm border">
              <code>{generatePythonCode()}</code>
            </pre>
          </div>
        </div>

        {/* Integration Notes */}
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-l-2 border-green-200">
          <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">Integration Notes:</h5>
          <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
            <li>• JSON Schema is automatically generated from your field definitions</li>
            <li>• Extraction hints improve OCR accuracy by providing context</li>
            <li>• Confidence thresholds help filter low-quality extractions</li>
            <li>• Cross-field validation ensures data consistency</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
