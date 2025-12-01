export type DocumentStatus = 'processing' | 'completed' | 'error';

export type DocumentRecord = {
  id: string;
  dossierRef: string;
  documentType: string;
  fileName: string;
  uploadDate: Date;
  status: DocumentStatus;
  confidence: number;
  installer: string;
  url: string;
};

export const mockDocuments: DocumentRecord[] = [
  {
    id: 'doc1',
    dossierRef: 'VAL-2025-0001',
    documentType: 'Devis',
    fileName: 'devis_dupont_2024.pdf',
    uploadDate: new Date('2024-11-25T09:30:00Z'),
    status: 'completed',
    confidence: 96,
    installer: 'EcoTherm Solutions',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'doc2',
    dossierRef: 'VAL-2025-0001',
    documentType: 'Facture',
    fileName: 'facture_001234.pdf',
    uploadDate: new Date('2024-11-25T09:35:00Z'),
    status: 'completed',
    confidence: 94,
    installer: 'EcoTherm Solutions',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'doc3',
    dossierRef: 'VAL-2025-0002',
    documentType: 'AH',
    fileName: 'attestation_honneur.pdf',
    uploadDate: new Date('2024-11-25T10:15:00Z'),
    status: 'processing',
    confidence: 0,
    installer: 'GreenEnergy Pro',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'doc4',
    dossierRef: 'VAL-2025-0003',
    documentType: 'CDC',
    fileName: 'cadre_contribution.pdf',
    uploadDate: new Date('2024-11-25T10:30:00Z'),
    status: 'completed',
    confidence: 92,
    installer: "Rénov'Habitat",
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'doc5',
    dossierRef: 'VAL-2025-0004',
    documentType: 'Devis',
    fileName: 'devis_renovation.pdf',
    uploadDate: new Date('2024-11-25T11:00:00Z'),
    status: 'error',
    confidence: 0,
    installer: 'Isolation Plus',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];

export function getDocumentById(id: string): DocumentRecord | undefined {
  return mockDocuments.find((d) => d.id === id);
}
