/**
 * Types for the new bulk document upload flow
 * Where installers can upload multiple documents at once and the system
 * automatically detects CEE processes from the Attestation sur l'honneur
 */

export type BulkUploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

export type BulkUploadedFile = {
  id: string;
  file: File;
  status: BulkUploadStatus;
  progress: number;
  error?: string;
};

export type DocumentClassification =
  | 'devis'
  | 'facture'
  | 'attestation_honneur'
  | 'cadre_contribution'
  | 'photos'
  | 'justificatif_domicile'
  | 'piece_identite'
  | 'rge_certificat'
  | 'unknown';

export type DetectedDocument = {
  id: string;
  originalFileId: string;
  originalFileName: string;
  classification: DocumentClassification;
  classificationLabel: string;
  confidence: number;
  pageNumbers?: number[]; // If extracted from multi-page PDF
  previewUrl?: string;
  // Process codes detected from this document (for attestation_honneur)
  detectedProcessCodes?: string[];
};

// Process detected from Attestation sur l'honneur
export type DetectedProcess = {
  code: string;
  name: string;
  description: string;
  category: string;
  // Whether this process was detected from an Attestation sur l'honneur
  fromAttestation: boolean;
};

export type BulkUploadStep = 'upload' | 'review' | 'confirmation';

// Submission result - processing happens in background
export type SubmissionResult = {
  dossierId: string;
  selectedProcesses: string[];
  uploadedFileCount: number;
  status: 'submitted' | 'processing';
  message: string;
};

// Classification labels in French
export const DOCUMENT_CLASSIFICATION_LABELS: Record<DocumentClassification, string> = {
  devis: 'Devis',
  facture: 'Facture',
  attestation_honneur: 'Attestation sur l\'honneur',
  cadre_contribution: 'Cadre de contribution',
  photos: 'Photos de l\'installation',
  justificatif_domicile: 'Justificatif de domicile',
  piece_identite: 'Pièce d\'identité',
  rge_certificat: 'Certificat RGE',
  unknown: 'Document non reconnu',
};

