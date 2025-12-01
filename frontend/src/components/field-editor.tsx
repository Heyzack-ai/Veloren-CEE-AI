'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ValidationField } from '@/types/validation';
import { Check, X, RotateCw, AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FieldEditorProps = {
  field: ValidationField;
  onValueChange: (value: string | number | boolean) => void;
  onMarkWrong: () => void;
  onRerunCheck: () => void;
};

export function FieldEditor({
  field,
  onValueChange,
  onMarkWrong,
  onRerunCheck,
}: FieldEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.correctedValue || field.value);

  const handleSave = () => {
    onValueChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(field.correctedValue || field.value);
    setIsEditing(false);
  };

  const displayValue = field.correctedValue || field.value;
  const isMarkedWrong = field.status === 'marked_wrong';
  const isCorrected = field.status === 'corrected';

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-700';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getRuleStatusIcon = (status: 'passed' | 'warning' | 'error') => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getRuleStatusBg = (status: 'passed' | 'warning' | 'error') => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card">
      {/* Field Label and Confidence */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          {field.displayName}
        </label>
        <div className="flex items-center gap-2">
          {isMarkedWrong && (
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              <AlertCircle className="h-3 w-3 mr-1" />
              Marqué incorrect
            </Badge>
          )}
          {isCorrected && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Corrigé
            </Badge>
          )}
          <Badge variant="secondary" className={getConfidenceColor(field.confidence)}>
            <Check className="h-3 w-3 mr-1" />
            {field.confidence}%
          </Badge>
        </div>
      </div>

      {/* Field Value */}
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editValue?.toString() || ''}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'p-3 rounded-md border bg-background cursor-pointer hover:border-primary/50 transition-colors',
            isMarkedWrong && 'border-red-500 bg-red-50'
          )}
          onClick={() => setIsEditing(true)}
        >
          <p className="font-medium">{displayValue?.toString()}</p>
          {field.originalValue && field.originalValue !== displayValue && (
            <p className="text-xs text-muted-foreground mt-1">
              Original: {field.originalValue.toString()}
            </p>
          )}
        </div>
      )}

      {/* Validation Rule Info */}
      {field.validationRule && (
        <div className={cn('p-3 rounded-md border text-sm', getRuleStatusBg(field.validationRule.status))}>
          <div className="flex items-start gap-2">
            {getRuleStatusIcon(field.validationRule.status)}
            <div className="flex-1">
              <p className="font-medium">{field.validationRule.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {field.validationRule.description}
              </p>
              {field.validationRule.message && (
                <p className="text-xs mt-1 font-medium">
                  {field.validationRule.status === 'passed' ? '✓' : '→'} {field.validationRule.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions - Only Marquer incorrect and Relancer vérification */}
      <div className="flex items-center gap-2">
        {!isMarkedWrong && (
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkWrong}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Marquer incorrect
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onRerunCheck}>
          <RotateCw className="h-4 w-4 mr-1" />
          Relancer vérification
        </Button>
      </div>
    </div>
  );
}