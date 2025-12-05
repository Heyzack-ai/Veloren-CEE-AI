import { Dossier, DossierProcess, DossierStatus, Priority } from '@/types/dossier';

const statuses: DossierStatus[] = ['draft', 'processing', 'awaiting_review', 'approved', 'rejected', 'billed', 'paid'];
const priorities: Priority[] = ['low', 'normal', 'high'];

const beneficiaryNames = [
  'Laurent Bernais', 'Sophie Martin', 'Pierre Dubois', 'Marie Lefebvre',
  'Jean Moreau', 'Claire Bernard', 'Michel Petit', 'Anne Durand',
  'François Robert', 'Isabelle Simon', 'Jacques Laurent', 'Catherine Blanc',
];

const addresses = [
  '12 Rue de la République', '45 Avenue des Champs', '78 Boulevard Voltaire',
  '23 Rue Victor Hugo', '56 Avenue Jean Jaurès', '89 Rue de la Liberté',
  '34 Place de la Mairie', '67 Rue du Commerce', '91 Avenue de la Paix',
];

const cities = [
  { name: 'Paris', postal: '75001' },
  { name: 'Lyon', postal: '69001' },
  { name: 'Marseille', postal: '13001' },
  { name: 'Toulouse', postal: '31000' },
  { name: 'Nice', postal: '06000' },
  { name: 'Nantes', postal: '44000' },
];

const processes = [
  { code: 'BAR-TH-171', name: 'Pompe à chaleur air/eau' },
  { code: 'BAR-TH-104', name: 'Fenêtre ou porte-fenêtre complète avec vitrage isolant' },
  { code: 'BAR-TH-106', name: 'Chaudière individuelle à haute performance énergétique' },
  { code: 'BAR-TH-127', name: 'Ventilation mécanique contrôlée double flux' },
  { code: 'BAR-EN-101', name: 'Isolation de combles ou de toitures' },
];

const installers = [
  { id: 'inst-1', name: 'EcoTherm Solutions' },
  { id: 'inst-2', name: 'GreenEnergy Pro' },
  { id: 'inst-3', name: 'Rénov\'Habitat' },
  { id: 'inst-4', name: 'ThermoConfort' },
  { id: 'inst-5', name: 'IsoPlus Services' },
];

const validators = [
  { id: 'val-1', name: 'Marie Validator' },
  { id: 'val-2', name: 'Pierre Contrôleur' },
  { id: 'val-3', name: 'Sophie Vérificateur' },
];

function generateReference(index: number): string {
  const year = 2025;
  const num = String(index).padStart(4, '0');
  return `VAL-${year}-${num}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateProjectTimeline(baseDate: Date): DossierProcess['projectTimeline'] {
  const devisDate = new Date(baseDate);
  devisDate.setDate(devisDate.getDate() - Math.floor(Math.random() * 30) - 30); // 30-60 days before

  const signatureDate = new Date(devisDate);
  signatureDate.setDate(signatureDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days after devis

  const worksStartDate = new Date(signatureDate);
  worksStartDate.setDate(worksStartDate.getDate() + Math.floor(Math.random() * 14) + 7); // 7-21 days after signature

  const worksEndDate = new Date(worksStartDate);
  worksEndDate.setDate(worksEndDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days after start

  const invoiceDate = new Date(worksEndDate);
  invoiceDate.setDate(invoiceDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days after works end

  return {
    devisDate,
    signatureDate,
    worksStartDate,
    worksEndDate,
    invoiceDate,
  };
}

function generateCumacValue(processCode: string): number {
  // Realistic CUMAC values based on process type
  const cumacRanges: Record<string, [number, number]> = {
    'BAR-TH-171': [25000, 45000],  // Heat pump
    'BAR-TH-104': [5000, 15000],   // Windows
    'BAR-TH-106': [15000, 30000],  // High-efficiency boiler
    'BAR-TH-127': [20000, 35000],  // VMC double flux
    'BAR-EN-101': [30000, 60000],  // Insulation
  };
  const range = cumacRanges[processCode] || [10000, 30000];
  return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
}

function generateDossierProcess(dossierId: string, processIndex: number, processInfo: { code: string; name: string }, validator?: { id: string; name: string }, submittedAt?: Date): DossierProcess {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

  return {
    id: `${dossierId}-process-${processIndex}`,
    processCode: processInfo.code,
    processName: processInfo.name,
    status,
    confidence,
    documents: [],
    extractedData: [],
    validationResults: [],
    processingTime: Math.floor(Math.random() * 120) + 30,
    validatedAt: status === 'approved' || status === 'rejected' ? new Date() : undefined,
    validatedBy: status === 'approved' || status === 'rejected' ? validator?.name : undefined,
    cumacValue: generateCumacValue(processInfo.code),
    projectTimeline: generateProjectTimeline(submittedAt || new Date()),
  };
}

function generateMockDossier(index: number): Dossier {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const primaryProcess = processes[Math.floor(Math.random() * processes.length)];
  const installer = installers[Math.floor(Math.random() * installers.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const validator = status === 'awaiting_review' || status === 'approved' || status === 'rejected'
    ? validators[Math.floor(Math.random() * validators.length)]
    : undefined;

  const submittedAt = randomDate(new Date(2024, 10, 1), new Date());
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

  const dossierId = `dossier-${index}`;

  // Generate 1-3 processes per dossier for variety
  // First few dossiers (1-5) get multiple processes for easy testing
  const numProcesses = index <= 5 ? (index <= 2 ? 3 : 2) : (Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 2 : 1);

  // Get unique processes for this dossier
  const shuffledProcesses = [...processes].sort(() => Math.random() - 0.5);
  const dossierProcesses: DossierProcess[] = [];

  for (let i = 0; i < numProcesses && i < shuffledProcesses.length; i++) {
    dossierProcesses.push(generateDossierProcess(dossierId, i + 1, shuffledProcesses[i], validator, submittedAt));
  }

  return {
    id: dossierId,
    reference: generateReference(index),
    beneficiary: {
      name: beneficiaryNames[Math.floor(Math.random() * beneficiaryNames.length)],
      address: addresses[Math.floor(Math.random() * addresses.length)],
      city: city.name,
      postalCode: city.postal,
      email: Math.random() > 0.3 ? 'beneficiary@example.com' : undefined,
      phone: Math.random() > 0.3 ? '06 12 34 56 78' : undefined,
      precarityStatus: Math.random() > 0.5 ? 'modeste' : 'classique',
    },
    // Keep legacy fields for backward compatibility (using first process)
    processCode: primaryProcess.code,
    processName: primaryProcess.name,
    installerId: installer.id,
    installerName: installer.name,
    status,
    priority,
    confidence,
    assignedValidatorId: validator?.id,
    assignedValidatorName: validator?.name,
    submittedAt,
    updatedAt: new Date(submittedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
    validatedAt: status === 'approved' || status === 'rejected' ? new Date() : undefined,
    validatedBy: status === 'approved' || status === 'rejected' ? validator?.name : undefined,
    documents: [],
    extractedData: [],
    validationResults: [],
    processingTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
    cumacValue: generateCumacValue(primaryProcess.code),
    projectTimeline: generateProjectTimeline(submittedAt),
    // New: Array of CEE processes
    processes: dossierProcesses,
  };
}

export const mockDossiers: Dossier[] = Array.from({ length: 100 }, (_, i) => generateMockDossier(i + 1));

export function getDossiersByStatus(status: DossierStatus): Dossier[] {
  return mockDossiers.filter(d => d.status === status);
}

export function getDossierById(id: string): Dossier | undefined {
  return mockDossiers.find(d => d.id === id);
}

export function getDossiersByInstaller(installerId: string): Dossier[] {
  return mockDossiers.filter(d => d.installerId === installerId);
}

export function getDossiersByValidator(validatorId: string): Dossier[] {
  return mockDossiers.filter(d => d.assignedValidatorId === validatorId);
}

// Get a specific process from a dossier
export function getProcessFromDossier(dossierId: string, processId: string): DossierProcess | undefined {
  const dossier = getDossierById(dossierId);
  if (!dossier) return undefined;
  return dossier.processes.find(p => p.id === processId);
}

// Get dossiers that have processes with a specific status
export function getDossiersWithProcessStatus(status: DossierStatus): Dossier[] {
  return mockDossiers.filter(d => d.processes.some(p => p.status === status));
}