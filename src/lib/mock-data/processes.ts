import { Process, ProcessCategory } from '@/types/process';

export const mockProcesses: Process[] = [
  {
    id: 'proc-1',
    code: 'BAR-TH-171',
    name: 'Pompe à chaleur air/eau',
    category: 'cee_residential',
    description: 'Installation d\'une pompe à chaleur air/eau pour le chauffage et/ou la production d\'eau chaude sanitaire',
    version: '1.2',
    isActive: true,
    isCoupDePouce: true,
    validFrom: new Date('2024-01-01'),
    requiredDocuments: [
      { documentType: 'Devis', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Facture', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'AH', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'CDC', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Photos', required: false, condition: '', minCount: 0, maxCount: 10 },
    ],
    documentCount: 5,
    ruleCount: 15,
    dossierCount: 234,
    updatedAt: new Date('2024-11-15'),
  },
  {
    id: 'proc-2',
    code: 'BAR-TH-104',
    name: 'Fenêtre ou porte-fenêtre complète avec vitrage isolant',
    category: 'cee_residential',
    description: 'Mise en place de fenêtres ou portes-fenêtres complètes avec vitrage isolant',
    version: '1.0',
    isActive: true,
    isCoupDePouce: false,
    validFrom: new Date('2024-01-01'),
    requiredDocuments: [
      { documentType: 'Devis', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Facture', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'AH', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Photos', required: true, condition: '', minCount: 2, maxCount: 10 },
    ],
    documentCount: 4,
    ruleCount: 12,
    dossierCount: 189,
    updatedAt: new Date('2024-10-20'),
  },
  {
    id: 'proc-3',
    code: 'BAR-TH-106',
    name: 'Chaudière individuelle à haute performance énergétique',
    category: 'cee_residential',
    description: 'Installation d\'une chaudière individuelle à haute performance énergétique',
    version: '1.1',
    isActive: true,
    isCoupDePouce: true,
    validFrom: new Date('2024-01-01'),
    requiredDocuments: [
      { documentType: 'Devis', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Facture', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'AH', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'CDC', required: true, condition: '', minCount: 1, maxCount: 1 },
    ],
    documentCount: 4,
    ruleCount: 14,
    dossierCount: 156,
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: 'proc-4',
    code: 'BAR-TH-127',
    name: 'Ventilation mécanique contrôlée double flux',
    category: 'cee_residential',
    description: 'Mise en place d\'un système de ventilation mécanique contrôlée double flux',
    version: '1.0',
    isActive: true,
    isCoupDePouce: false,
    validFrom: new Date('2024-01-01'),
    requiredDocuments: [
      { documentType: 'Devis', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Facture', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'AH', required: true, condition: '', minCount: 1, maxCount: 1 },
    ],
    documentCount: 3,
    ruleCount: 10,
    dossierCount: 78,
    updatedAt: new Date('2024-09-15'),
  },
  {
    id: 'proc-5',
    code: 'BAR-EN-101',
    name: 'Isolation de combles ou de toitures',
    category: 'cee_residential',
    description: 'Isolation thermique des combles perdus ou aménagés',
    version: '2.0',
    isActive: true,
    isCoupDePouce: true,
    validFrom: new Date('2024-01-01'),
    requiredDocuments: [
      { documentType: 'Devis', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Facture', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'AH', required: true, condition: '', minCount: 1, maxCount: 1 },
      { documentType: 'Photos', required: true, condition: '', minCount: 3, maxCount: 15 },
    ],
    documentCount: 4,
    ruleCount: 11,
    dossierCount: 312,
    updatedAt: new Date('2024-11-10'),
  },
];

export function getProcessById(id: string): Process | undefined {
  return mockProcesses.find(p => p.id === id);
}

export function getProcessByCode(code: string): Process | undefined {
  return mockProcesses.find(p => p.code === code);
}

export function getActiveProcesses(): Process[] {
  return mockProcesses.filter(p => p.isActive);
}