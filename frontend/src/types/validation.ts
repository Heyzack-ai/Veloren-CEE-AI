export type DocumentType = 'devis' | 'facture' | 'attestation_honneur' | 'cadre_contribution' | 'photos';

export type ValidationFieldStatus = 'unreviewed' | 'confirmed' | 'marked_wrong' | 'corrected';

export type FieldValidationRule = {
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'error';
  message?: string;
};

export type ValidationField = {
  id: string;
  documentType: DocumentType;
  fieldName: string;
  displayName: string;
  value: string | number | boolean;
  confidence: number;
  status: ValidationFieldStatus;
  originalValue?: string | number | boolean;
  correctedValue?: string | number | boolean;
  markedWrongAt?: Date;
  markedWrongBy?: string;
  rerunRequested?: boolean;
  validationRule?: FieldValidationRule;
};

export type ValidationRuleStatus = 'passed' | 'warning' | 'error';

export type ValidationRule = {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: ValidationRuleStatus;
  message?: string;
  affectedFields?: string[];
  canOverride: boolean;
  overridden?: boolean;
  overrideReason?: string;
};

export type PDFDocument = {
  id: string;
  type: DocumentType;
  displayName: string;
  filename: string;
  url: string;
  pageCount: number;
  confidence: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
};

export type ValidationState = {
  dossierId: string;
  currentDocumentId: string;
  fields: ValidationField[];
  rules: ValidationRule[];
  timeSpent: number;
  lastSaved?: Date;
  isDirty: boolean;
};