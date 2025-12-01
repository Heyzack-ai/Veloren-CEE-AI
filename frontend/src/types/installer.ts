export type RGEStatus = 'valid' | 'expired' | 'not_verified';

export type Installer = {
  id: string;
  companyName: string;
  siret: string;
  siren: string;
  address: string;
  city: string;
  postalCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  rgeNumber: string;
  rgeValidUntil: Date;
  rgeStatus: RGEStatus;
  qualificationTypes: string[];
  active: boolean;
  activeDossiersCount: number;
  totalDossiersCount: number;
  contractReference?: string;
  createdAt: Date;
};

export type DossierMilestone = {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
  completedAt?: Date;
  description?: string;
};

export type ValidationFeedback = {
  id: string;
  type: 'rejection' | 'correction_request';
  reason: string;
  corrections: CorrectionItem[];
  createdAt: Date;
  createdBy: string;
};

export type CorrectionItem = {
  documentType: string;
  issue: string;
  required: boolean;
};

export type UploadStep = 'select_operation' | 'upload_documents' | 'review' | 'confirmation';

export type UploadedFile = {
  id: string;
  file: File;
  documentType: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
};

export type ProcessCategory = 'all' | 'residential' | 'tertiary' | 'industrial';

export type CEEProcess = {
  code: string;
  name: string;
  description: string;
  category: ProcessCategory;
  requiredDocuments: RequiredDocument[];
};

export type RequiredDocument = {
  type: string;
  name: string;
  requirement: 'required' | 'optional' | 'conditional';
  description: string;
  acceptedFormats: string[];
  maxSize: number;
  allowMultiple: boolean;
};