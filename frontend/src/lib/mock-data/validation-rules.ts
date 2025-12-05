export type RuleSeverity = 'error' | 'warning' | 'info';
export type RuleType = 'document' | 'cross_document' | 'global';

export type ValidationRule = {
  id: string;
  code: string;
  name: string;
  description: string;
  type: RuleType;
  severity: RuleSeverity;
  appliesTo: {
    documentTypes?: string[];
    processTypes?: string[]; // Array of process IDs (multi-select)
  };
  isActive: boolean;
  autoReject: boolean;
  condition: string;
  errorMessage: string;
  timesEvaluated: number;
  passedCount: number;
  failedCount: number;
  overrideCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export const mockValidationRules: ValidationRule[] = [
  {
    id: 'rule1',
    code: 'PRIME_CONSISTENCY',
    name: 'Cohérence Prime CEE',
    description: 'Vérifie que le montant de la prime CEE est identique sur le devis, la facture et le CDC',
    type: 'cross_document',
    severity: 'error',
    appliesTo: {
      documentTypes: ['DEVIS', 'FACTURE', 'CDC'],
      processTypes: ['proc-1', 'proc-3'], // BAR-TH-171, BAR-TH-106
    },
    isActive: true,
    autoReject: false,
    condition: 'devis.prime_cee === facture.prime_cee && facture.prime_cee === cdc.prime_montant',
    errorMessage: 'Le montant de la prime CEE diffère entre les documents: Devis={devis.prime_cee}, Facture={facture.prime_cee}, CDC={cdc.prime_montant}',
    timesEvaluated: 1250,
    passedCount: 1180,
    failedCount: 70,
    overrideCount: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: 'rule2',
    code: 'DATE_COHERENCE',
    name: 'Cohérence des dates',
    description: 'Vérifie que la date de facture est postérieure à la date du devis',
    type: 'cross_document',
    severity: 'error',
    appliesTo: {
      documentTypes: ['DEVIS', 'FACTURE'],
      processTypes: [], // Empty means all processes
    },
    isActive: true,
    autoReject: false,
    condition: 'facture.invoice_date >= devis.quote_date',
    errorMessage: 'La date de facture ({facture.invoice_date}) est antérieure à la date du devis ({devis.quote_date})',
    timesEvaluated: 1250,
    passedCount: 1235,
    failedCount: 15,
    overrideCount: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-15'),
  },
  {
    id: 'rule3',
    code: 'SIGNATURE_PRESENT',
    name: 'Présence des signatures',
    description: 'Vérifie que toutes les signatures requises sont présentes',
    type: 'document',
    severity: 'error',
    appliesTo: {
      documentTypes: ['AH', 'CDC'],
      processTypes: [], // Empty means all processes
    },
    isActive: true,
    autoReject: false,
    condition: 'signature.present === true',
    errorMessage: 'Signature manquante sur le document',
    timesEvaluated: 2500,
    passedCount: 2420,
    failedCount: 80,
    overrideCount: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-09-10'),
  },
  {
    id: 'rule4',
    code: 'EQUIPMENT_SPECS',
    name: 'Spécifications équipement',
    description: 'Vérifie que les spécifications de l\'équipement respectent les critères CEE',
    type: 'document',
    severity: 'error',
    appliesTo: {
      documentTypes: ['DEVIS'],
      processTypes: ['proc-1'], // BAR-TH-171
    },
    isActive: true,
    autoReject: false,
    condition: 'equipment.cop >= 3.9 && equipment.etas >= 126',
    errorMessage: 'Les spécifications de l\'équipement ne respectent pas les critères: COP={equipment.cop}, ETAS={equipment.etas}',
    timesEvaluated: 450,
    passedCount: 430,
    failedCount: 20,
    overrideCount: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-05'),
  },
  {
    id: 'rule5',
    code: 'AMOUNT_REMAINING',
    name: 'Reste à payer',
    description: 'Avertit si le montant restant à payer est supérieur à 10% du total',
    type: 'document',
    severity: 'warning',
    appliesTo: {
      documentTypes: ['FACTURE'],
      processTypes: [], // Empty means all processes
    },
    isActive: true,
    autoReject: false,
    condition: '(facture.total_ttc - facture.amount_paid) / facture.total_ttc <= 0.1',
    errorMessage: 'Le montant restant à payer ({facture.total_ttc - facture.amount_paid}€) représente plus de 10% du total',
    timesEvaluated: 1250,
    passedCount: 1100,
    failedCount: 150,
    overrideCount: 80,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-08-20'),
  },
  {
    id: 'rule6',
    code: 'BON_POUR_ACCORD',
    name: 'Mention "Bon pour accord"',
    description: 'Vérifie la présence de la mention "Bon pour accord" sur le devis',
    type: 'document',
    severity: 'warning',
    appliesTo: {
      documentTypes: ['DEVIS'],
      processTypes: [], // Empty means all processes
    },
    isActive: true,
    autoReject: false,
    condition: 'devis.bon_pour_accord === true',
    errorMessage: 'La mention "Bon pour accord" n\'a pas été détectée sur le devis',
    timesEvaluated: 1250,
    passedCount: 1150,
    failedCount: 100,
    overrideCount: 60,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-07-15'),
  },
  {
    id: 'rule7',
    code: 'RGE_VALID',
    name: 'Certification RGE valide',
    description: 'Vérifie que la certification RGE de l\'installateur est valide',
    type: 'global',
    severity: 'error',
    appliesTo: {
      processTypes: [], // Empty means all processes
    },
    isActive: true,
    autoReject: true,
    condition: 'installer.rge_valid_until > current_date',
    errorMessage: 'La certification RGE de l\'installateur a expiré le {installer.rge_valid_until}',
    timesEvaluated: 1250,
    passedCount: 1240,
    failedCount: 10,
    overrideCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: 'rule8',
    code: 'SIGNATURE_CONSISTENCY',
    name: 'Cohérence des signatures',
    description: 'Vérifie que les signatures du bénéficiaire sont cohérentes entre les documents',
    type: 'cross_document',
    severity: 'warning',
    appliesTo: {
      documentTypes: ['DEVIS', 'AH', 'CDC'],
      processTypes: ['proc-1', 'proc-2', 'proc-3'], // Multiple processes
    },
    isActive: true,
    autoReject: false,
    condition: 'signature_similarity(devis.signature, ah.signature, cdc.signature) >= 0.85',
    errorMessage: 'Les signatures du bénéficiaire présentent des différences significatives entre les documents',
    timesEvaluated: 1250,
    passedCount: 1100,
    failedCount: 150,
    overrideCount: 120,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-10'),
  },
];

export function getRuleById(id: string): ValidationRule | undefined {
  return mockValidationRules.find(r => r.id === id);
}

export function getRulesByType(type: RuleType): ValidationRule[] {
  return mockValidationRules.filter(r => r.type === type);
}

export function getRulesBySeverity(severity: RuleSeverity): ValidationRule[] {
  return mockValidationRules.filter(r => r.severity === severity);
}

export function getActiveRules(): ValidationRule[] {
  return mockValidationRules.filter(r => r.isActive);
}