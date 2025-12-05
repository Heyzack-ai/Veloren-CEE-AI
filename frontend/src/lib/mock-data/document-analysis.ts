/**
 * Mock document analysis service
 * Simulates quick detection of CEE processes from Attestation sur l'honneur
 * Full analysis happens in background after submission
 */

import {
  BulkUploadedFile,
  DetectedDocument,
  DetectedProcess,
  DocumentClassification,
  DOCUMENT_CLASSIFICATION_LABELS,
} from '@/types/bulk-upload';
import { mockCEEProcesses } from './processes-detailed';

// Mock process codes that can be detected from Attestation sur l'honneur
const DETECTABLE_PROCESS_CODES = [
  'BAR-TH-104', // Fenêtre
  'BAR-TH-106', // Chaudière
  'BAR-TH-127', // VMC double flux
  'BAR-TH-143', // Système solaire
  'BAR-TH-148', // Chauffe-eau thermodynamique
  'BAR-TH-171', // Pompe à chaleur
  'BAR-EN-101', // Isolation combles
  'BAR-EN-102', // Isolation murs
  'BAR-EN-103', // Isolation toiture
];

// Simulates quick document type detection based on filename
function quickClassifyDocument(filename: string): {
  classification: DocumentClassification;
  confidence: number;
  detectedProcessCodes?: string[];
} {
  const lowerName = filename.toLowerCase();

  // Attestation sur l'honneur - detect process codes from it
  if (lowerName.includes('attestation') || lowerName.includes('honneur')) {
    // Simulate detecting process codes from attestation content
    // In real implementation, this would be OCR/AI extraction
    const detectedCodes = simulateProcessCodeExtraction(filename);
    return {
      classification: 'attestation_honneur',
      confidence: 0.95,
      detectedProcessCodes: detectedCodes,
    };
  }

  if (lowerName.includes('devis') || lowerName.includes('quote')) {
    return { classification: 'devis', confidence: 0.92 };
  }
  if (lowerName.includes('facture') || lowerName.includes('invoice')) {
    return { classification: 'facture', confidence: 0.95 };
  }
  if (lowerName.includes('cadre') || lowerName.includes('contribution')) {
    return { classification: 'cadre_contribution', confidence: 0.85 };
  }
  if (lowerName.includes('photo') || lowerName.includes('img') ||
      lowerName.endsWith('.jpg') || lowerName.endsWith('.png')) {
    return { classification: 'photos', confidence: 0.90 };
  }
  if (lowerName.includes('rge') || lowerName.includes('certificat')) {
    return { classification: 'rge_certificat', confidence: 0.87 };
  }

  // For PDFs without specific names, classify as unknown initially
  // Backend will do full analysis
  return { classification: 'unknown', confidence: 0.5 };
}

// Simulates extracting process codes from attestation filename/content
function simulateProcessCodeExtraction(filename: string): string[] {
  const lowerName = filename.toLowerCase();
  const detected: string[] = [];

  // Check for process codes in filename
  for (const code of DETECTABLE_PROCESS_CODES) {
    if (lowerName.includes(code.toLowerCase().replace('-', ''))) {
      detected.push(code);
    }
  }

  // If no codes found in filename, simulate random detection (mock behavior)
  if (detected.length === 0) {
    // Randomly pick 1-2 process codes for demo purposes
    const shuffled = [...DETECTABLE_PROCESS_CODES].sort(() => Math.random() - 0.5);
    const count = Math.random() > 0.5 ? 2 : 1;
    detected.push(...shuffled.slice(0, count));
  }

  return detected;
}

// Quick scan of uploaded files to detect documents and process codes
export function quickScanDocuments(files: BulkUploadedFile[]): {
  detectedDocuments: DetectedDocument[];
  detectedProcesses: DetectedProcess[];
} {
  const completedFiles = files.filter(f => f.status === 'completed');
  const detectedDocuments: DetectedDocument[] = [];
  const allProcessCodes = new Set<string>();

  for (const file of completedFiles) {
    const { classification, confidence, detectedProcessCodes } = quickClassifyDocument(file.file.name);

    detectedDocuments.push({
      id: `${file.id}-doc-0`,
      originalFileId: file.id,
      originalFileName: file.file.name,
      classification,
      classificationLabel: DOCUMENT_CLASSIFICATION_LABELS[classification],
      confidence,
      detectedProcessCodes,
    });

    // Collect process codes from attestations
    if (detectedProcessCodes) {
      detectedProcessCodes.forEach(code => allProcessCodes.add(code));
    }
  }

  // Map detected codes to process info
  const detectedProcesses: DetectedProcess[] = [];
  Array.from(allProcessCodes).forEach(code => {
    const process = mockCEEProcesses.find(p => p.code === code);
    if (process) {
      detectedProcesses.push({
        code: process.code,
        name: process.name,
        description: process.description,
        category: process.category,
        fromAttestation: true,
      });
    }
  });

  return { detectedDocuments, detectedProcesses };
}

// Get all available CEE processes for manual selection
export function getAllCEEProcesses(): DetectedProcess[] {
  return mockCEEProcesses.map(p => ({
    code: p.code,
    name: p.name,
    description: p.description,
    category: p.category,
    fromAttestation: false,
  }));
}

// Simulate submission - returns immediately, processing happens in background
export async function submitDossier(
  files: BulkUploadedFile[],
  selectedProcessCodes: string[],
  beneficiaryInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }
): Promise<{
  dossierId: string;
  message: string;
}> {
  // Simulate quick submission - no heavy processing
  await new Promise(resolve => setTimeout(resolve, 500));

  const dossierId = `CEE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return {
    dossierId,
    message: `Dossier soumis avec succès. Vous recevrez un email à ${beneficiaryInfo?.email || 'votre adresse email'} avec les résultats de l'analyse.`,
  };
}

