export type DossierStatus = 
  | 'draft' 
  | 'processing' 
  | 'awaiting_review' 
  | 'approved' 
  | 'rejected' 
  | 'billed' 
  | 'paid';

export type Priority = 'low' | 'normal' | 'high';

export type Beneficiary = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  email?: string;
  phone?: string;
  precarityStatus: 'classique' | 'modeste' | 'tres_modeste';
};

export type Document = {
  id: string;
  dossierId: string;
  type: string;
  filename: string;
  url: string;
  uploadedAt: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidence?: number;
};

export type ExtractedField = {
  fieldName: string;
  displayName: string;
  value: any;
  confidence: number;
  sourceDocument: string;
  status: 'unreviewed' | 'confirmed' | 'corrected';
  originalValue?: any;
};

export type ValidationRule = {
  id: string;
  code: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  passed: boolean;
  message?: string;
  overridden?: boolean;
  overrideReason?: string;
};

export type Dossier = {
  id: string;
  reference: string;
  beneficiary: Beneficiary;
  processCode: string;
  processName: string;
  installerId: string;
  installerName: string;
  status: DossierStatus;
  priority: Priority;
  confidence: number;
  assignedValidatorId?: string;
  assignedValidatorName?: string;
  submittedAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  validatedBy?: string;
  documents: Document[];
  extractedData: ExtractedField[];
  validationResults: ValidationRule[];
  processingTime?: number;
};