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

// Project timeline milestones
export type ProjectTimeline = {
  devisDate?: Date;       // Quote date
  signatureDate?: Date;   // Contract signing date
  worksStartDate?: Date;  // Works start date
  worksEndDate?: Date;    // Works completion date
  invoiceDate?: Date;     // Invoice date
};

// CEE Process within a dossier
export type DossierProcess = {
  id: string;
  processCode: string;
  processName: string;
  status: DossierStatus;
  confidence: number;
  documents: Document[];
  extractedData: ExtractedField[];
  validationResults: ValidationRule[];
  processingTime?: number;
  validatedAt?: Date;
  validatedBy?: string;
  cumacValue?: number;           // kWh cumac value for this process
  projectTimeline?: ProjectTimeline;
};

export type Dossier = {
  id: string;
  reference: string;
  beneficiary: Beneficiary;
  /** @deprecated Use processes array instead */
  processCode: string;
  /** @deprecated Use processes array instead */
  processName: string;
  installerId: string;
  installerName: string;
  /** @deprecated Use processes array status instead */
  status: DossierStatus;
  priority: Priority;
  /** @deprecated Use processes array confidence instead */
  confidence: number;
  assignedValidatorId?: string;
  assignedValidatorName?: string;
  submittedAt: Date;
  updatedAt: Date;
  /** @deprecated Use processes array validatedAt instead */
  validatedAt?: Date;
  /** @deprecated Use processes array validatedBy instead */
  validatedBy?: string;
  /** @deprecated Use processes array documents instead */
  documents: Document[];
  /** @deprecated Use processes array extractedData instead */
  extractedData: ExtractedField[];
  /** @deprecated Use processes array validationResults instead */
  validationResults: ValidationRule[];
  /** @deprecated Use processes array processingTime instead */
  processingTime?: number;
  /** @deprecated Use processes array cumacValue instead */
  cumacValue?: number;
  /** @deprecated Use processes array projectTimeline instead */
  projectTimeline?: ProjectTimeline;
  // New: Array of CEE processes for this dossier
  processes: DossierProcess[];
};