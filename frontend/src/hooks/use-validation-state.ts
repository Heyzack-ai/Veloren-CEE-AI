import { useState, useCallback } from 'react';
import { ValidationField, ValidationRule } from '@/types/validation';

type UseValidationStateProps = {
  initialFields: ValidationField[];
  initialRules: ValidationRule[];
};

export function useValidationState({ initialFields, initialRules }: UseValidationStateProps) {
  const [fields, setFields] = useState<ValidationField[]>(initialFields);
  const [rules, setRules] = useState<ValidationRule[]>(initialRules);
  const [isDirty, setIsDirty] = useState(false);

  const updateFieldValue = useCallback((fieldId: string, newValue: string | number | boolean) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              correctedValue: newValue,
              status: 'corrected' as const,
            }
          : field
      )
    );
    setIsDirty(true);
  }, []);

  const markFieldWrong = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              status: 'marked_wrong' as const,
              markedWrongAt: new Date(),
            }
          : field
      )
    );
    setIsDirty(true);
  }, []);

  const confirmField = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              status: 'confirmed' as const,
            }
          : field
      )
    );
    setIsDirty(true);
  }, []);

  const requestRerun = useCallback((fieldId: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              rerunRequested: true,
            }
          : field
      )
    );
    setIsDirty(true);
  }, []);

  const overrideRule = useCallback((ruleId: string, reason: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              overridden: true,
              overrideReason: reason,
            }
          : rule
      )
    );
    setIsDirty(true);
  }, []);

  const save = useCallback(() => {
    // In a real app, this would save to backend
    console.log('Saving validation state...', { fields, rules });
    setIsDirty(false);
    return Promise.resolve();
  }, [fields, rules]);

  return {
    fields,
    rules,
    isDirty,
    updateFieldValue,
    markFieldWrong,
    confirmField,
    requestRerun,
    overrideRule,
    save,
  };
}