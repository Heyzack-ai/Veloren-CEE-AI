export type ProcessCategory = 
  | 'cee_residential' 
  | 'cee_tertiary' 
  | 'cee_industrial' 
  | 'custom';

export type DocumentRequirement = {
  documentType: string;
  required: boolean;
  condition?: string;
  minCount: number;
  maxCount: number;
};

export type Process = {
  id: string;
  code: string;
  name: string;
  category: ProcessCategory;
  description: string;
  version: string;
  isActive: boolean;
  isCoupDePouce: boolean;
  validFrom: Date;
  validUntil?: Date;
  requiredDocuments: DocumentRequirement[];
  documentCount: number;
  ruleCount: number;
  dossierCount: number;
  updatedAt: Date;
};