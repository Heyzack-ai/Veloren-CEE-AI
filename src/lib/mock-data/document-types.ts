export type DocumentTypeCategory = 'commercial' | 'legal' | 'administrative' | 'technical' | 'photos';

export type FieldDataType = 'string' | 'integer' | 'decimal' | 'currency' | 'date' | 'boolean' | 'email' | 'phone' | 'address' | 'enum' | 'signature';

export type FieldSchema = {
  id: string;
  internalName: string;
  displayName: string;
  dataType: FieldDataType;
  required: boolean;
  maxLength?: number;
  validationRegex?: string;
  minValue?: number;
  maxValue?: number;
  enumValues?: string[];
  extractionHints: string[];
  postProcessing: {
    uppercase?: boolean;
    lowercase?: boolean;
    trimWhitespace?: boolean;
    removeSpecialChars?: boolean;
  };
  fieldGroup?: string;
  crossReferenceFields?: string[];
  confidenceThreshold: number;
};

export type DocumentType = {
  id: string;
  code: string;
  name: string;
  category: DocumentTypeCategory;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  classificationHints: string[];
  expectedPageRange: {
    min: number;
    max: number;
  };
  fieldSchema: FieldSchema[];
  ruleCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export const mockDocumentTypes: DocumentType[] = [
  {
    id: 'dt1',
    code: 'DEVIS',
    name: 'Devis',
    category: 'commercial',
    description: 'Devis commercial pour les travaux CEE',
    isSystem: true,
    isActive: true,
    classificationHints: ['devis', 'quote', 'proposition', 'estimation'],
    expectedPageRange: { min: 1, max: 5 },
    fieldSchema: [
      {
        id: 'f1',
        internalName: 'quote_number',
        displayName: 'Numéro de devis',
        dataType: 'string',
        required: true,
        extractionHints: ['devis', 'n°', 'numéro'],
        postProcessing: { trimWhitespace: true },
        fieldGroup: 'Identification',
        confidenceThreshold: 85,
      },
      {
        id: 'f2',
        internalName: 'quote_date',
        displayName: 'Date du devis',
        dataType: 'date',
        required: true,
        extractionHints: ['date', 'le'],
        postProcessing: {},
        fieldGroup: 'Identification',
        confidenceThreshold: 85,
      },
      {
        id: 'f3',
        internalName: 'prime_cee',
        displayName: 'Prime CEE',
        dataType: 'currency',
        required: true,
        extractionHints: ['prime cee', 'prime énergie', 'aide cee'],
        postProcessing: {},
        fieldGroup: 'Financial',
        crossReferenceFields: ['facture.prime_cee', 'cdc.prime_montant'],
        confidenceThreshold: 90,
      },
      {
        id: 'f4',
        internalName: 'total_ttc',
        displayName: 'Total TTC',
        dataType: 'currency',
        required: true,
        extractionHints: ['total ttc', 'montant ttc'],
        postProcessing: {},
        fieldGroup: 'Financial',
        confidenceThreshold: 85,
      },
      {
        id: 'f5',
        internalName: 'equipment_brand',
        displayName: 'Marque équipement',
        dataType: 'string',
        required: true,
        extractionHints: ['marque', 'fabricant'],
        postProcessing: { uppercase: true, trimWhitespace: true },
        fieldGroup: 'Technical',
        confidenceThreshold: 80,
      },
      {
        id: 'f6',
        internalName: 'equipment_model',
        displayName: 'Modèle équipement',
        dataType: 'string',
        required: true,
        extractionHints: ['modèle', 'référence'],
        postProcessing: { trimWhitespace: true },
        fieldGroup: 'Technical',
        confidenceThreshold: 80,
      },
    ],
    ruleCount: 8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-15'),
  },
  {
    id: 'dt2',
    code: 'FACTURE',
    name: 'Facture',
    category: 'commercial',
    description: 'Facture des travaux réalisés',
    isSystem: true,
    isActive: true,
    classificationHints: ['facture', 'invoice', 'avoir'],
    expectedPageRange: { min: 1, max: 3 },
    fieldSchema: [
      {
        id: 'f7',
        internalName: 'invoice_number',
        displayName: 'Numéro de facture',
        dataType: 'string',
        required: true,
        extractionHints: ['facture', 'n°', 'numéro'],
        postProcessing: { trimWhitespace: true },
        fieldGroup: 'Identification',
        confidenceThreshold: 85,
      },
      {
        id: 'f8',
        internalName: 'invoice_date',
        displayName: 'Date de facture',
        dataType: 'date',
        required: true,
        extractionHints: ['date', 'le'],
        postProcessing: {},
        fieldGroup: 'Identification',
        confidenceThreshold: 85,
      },
      {
        id: 'f9',
        internalName: 'prime_cee',
        displayName: 'Prime CEE',
        dataType: 'currency',
        required: true,
        extractionHints: ['prime cee', 'prime énergie'],
        postProcessing: {},
        fieldGroup: 'Financial',
        crossReferenceFields: ['devis.prime_cee', 'cdc.prime_montant'],
        confidenceThreshold: 90,
      },
      {
        id: 'f10',
        internalName: 'total_ttc',
        displayName: 'Total TTC',
        dataType: 'currency',
        required: true,
        extractionHints: ['total ttc', 'montant ttc'],
        postProcessing: {},
        fieldGroup: 'Financial',
        confidenceThreshold: 85,
      },
      {
        id: 'f11',
        internalName: 'amount_paid',
        displayName: 'Montant payé',
        dataType: 'currency',
        required: false,
        extractionHints: ['payé', 'réglé', 'versé'],
        postProcessing: {},
        fieldGroup: 'Financial',
        confidenceThreshold: 80,
      },
    ],
    ruleCount: 6,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-10'),
  },
  {
    id: 'dt3',
    code: 'AH',
    name: 'Attestation sur l\'honneur',
    category: 'legal',
    description: 'Attestation sur l\'honneur du bénéficiaire',
    isSystem: true,
    isActive: true,
    classificationHints: ['attestation', 'honneur', 'certifie'],
    expectedPageRange: { min: 1, max: 2 },
    fieldSchema: [
      {
        id: 'f12',
        internalName: 'beneficiary_signature',
        displayName: 'Signature bénéficiaire',
        dataType: 'signature',
        required: true,
        extractionHints: ['signature', 'signé'],
        postProcessing: {},
        fieldGroup: 'Signatures',
        confidenceThreshold: 75,
      },
      {
        id: 'f13',
        internalName: 'date_signature',
        displayName: 'Date de signature',
        dataType: 'date',
        required: true,
        extractionHints: ['date', 'le', 'fait à'],
        postProcessing: {},
        fieldGroup: 'Identification',
        confidenceThreshold: 80,
      },
    ],
    ruleCount: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-09-20'),
  },
  {
    id: 'dt4',
    code: 'CDC',
    name: 'Cadre de contribution',
    category: 'administrative',
    description: 'Cadre de contribution et engagement',
    isSystem: true,
    isActive: true,
    classificationHints: ['cadre', 'contribution', 'engagement'],
    expectedPageRange: { min: 1, max: 2 },
    fieldSchema: [
      {
        id: 'f14',
        internalName: 'prime_montant',
        displayName: 'Montant de la prime',
        dataType: 'currency',
        required: true,
        extractionHints: ['prime', 'montant'],
        postProcessing: {},
        fieldGroup: 'Financial',
        crossReferenceFields: ['devis.prime_cee', 'facture.prime_cee'],
        confidenceThreshold: 90,
      },
      {
        id: 'f15',
        internalName: 'beneficiary_signature',
        displayName: 'Signature bénéficiaire',
        dataType: 'signature',
        required: true,
        extractionHints: ['signature', 'bénéficiaire'],
        postProcessing: {},
        fieldGroup: 'Signatures',
        confidenceThreshold: 75,
      },
      {
        id: 'f16',
        internalName: 'installer_signature',
        displayName: 'Signature installateur',
        dataType: 'signature',
        required: true,
        extractionHints: ['signature', 'installateur', 'professionnel'],
        postProcessing: {},
        fieldGroup: 'Signatures',
        confidenceThreshold: 75,
      },
    ],
    ruleCount: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-05'),
  },
  {
    id: 'dt5',
    code: 'PHOTOS',
    name: 'Photos',
    category: 'photos',
    description: 'Photos des travaux réalisés',
    isSystem: true,
    isActive: true,
    classificationHints: ['photo', 'image', 'jpg', 'jpeg', 'png'],
    expectedPageRange: { min: 1, max: 1 },
    fieldSchema: [],
    ruleCount: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-08-15'),
  },
];

export function getDocumentTypeById(id: string): DocumentType | undefined {
  return mockDocumentTypes.find(dt => dt.id === id);
}

export function getDocumentTypeByCode(code: string): DocumentType | undefined {
  return mockDocumentTypes.find(dt => dt.code === code);
}

export function getSystemDocumentTypes(): DocumentType[] {
  return mockDocumentTypes.filter(dt => dt.isSystem);
}

export function getCustomDocumentTypes(): DocumentType[] {
  return mockDocumentTypes.filter(dt => !dt.isSystem);
}