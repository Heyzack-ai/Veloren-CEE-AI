import {
  BillingDossier,
  BillingActivity,
  BillingSummary,
  CEECalculation,
  PaymentBreakdown,
  InstallerBillingInfo,
  CommunicationLogEntry,
} from '@/types/billing';

export const mockBillingDossiers: BillingDossier[] = [
  // Ready to Bill (approved)
  {
    id: 'billing-1',
    reference: 'VAL-2025-0089',
    beneficiaryName: 'Jean-Pierre Martin',
    beneficiaryAddress: '45 Rue de la République',
    beneficiaryCity: '69001 Lyon',
    installerName: 'EcoTherm Solutions',
    installerId: 'inst-1',
    processCode: 'BAR-TH-171',
    processName: 'Pompe à chaleur air/eau',
    approvedDate: new Date('2024-11-20'),
    approvedBy: 'Marie Validator',
    primeAmount: 4500,
    billingStatus: 'approved',
  },
  {
    id: 'billing-2',
    reference: 'VAL-2025-0092',
    beneficiaryName: 'Sophie Dubois',
    beneficiaryAddress: '12 Avenue des Champs',
    beneficiaryCity: '75008 Paris',
    installerName: 'GreenEnergy Pro',
    installerId: 'inst-2',
    processCode: 'BAR-TH-104',
    processName: 'Chaudière biomasse',
    approvedDate: new Date('2024-11-21'),
    approvedBy: 'Pierre Admin',
    primeAmount: 5200,
    billingStatus: 'approved',
  },
  {
    id: 'billing-3',
    reference: 'VAL-2025-0095',
    beneficiaryName: 'Michel Bernard',
    beneficiaryAddress: '8 Rue du Commerce',
    beneficiaryCity: '33000 Bordeaux',
    installerName: 'EcoTherm Solutions',
    installerId: 'inst-1',
    processCode: 'BAR-TH-171',
    processName: 'Pompe à chaleur air/eau',
    approvedDate: new Date('2024-11-22'),
    approvedBy: 'Marie Validator',
    primeAmount: 4800,
    billingStatus: 'approved',
  },
  {
    id: 'billing-4',
    reference: 'VAL-2025-0098',
    beneficiaryName: 'Claire Moreau',
    beneficiaryAddress: '23 Boulevard Victor Hugo',
    beneficiaryCity: '44000 Nantes',
    installerName: "Rénov'Habitat",
    installerId: 'inst-3',
    processCode: 'BAR-TH-106',
    processName: 'Chaudière haute performance',
    approvedDate: new Date('2024-11-23'),
    approvedBy: 'Pierre Admin',
    primeAmount: 3800,
    billingStatus: 'approved',
  },
  {
    id: 'billing-5',
    reference: 'VAL-2025-0101',
    beneficiaryName: 'François Laurent',
    beneficiaryAddress: '56 Rue Nationale',
    beneficiaryCity: '59000 Lille',
    installerName: 'GreenEnergy Pro',
    installerId: 'inst-2',
    processCode: 'BAR-TH-171',
    processName: 'Pompe à chaleur air/eau',
    approvedDate: new Date('2024-11-24'),
    approvedBy: 'Marie Validator',
    primeAmount: 4200,
    billingStatus: 'approved',
  },
  // Billed (awaiting payment)
  {
    id: 'billing-6',
    reference: 'VAL-2025-0078',
    beneficiaryName: 'Anne Petit',
    beneficiaryAddress: '34 Rue de la Liberté',
    beneficiaryCity: '31000 Toulouse',
    installerName: 'EcoTherm Solutions',
    installerId: 'inst-1',
    processCode: 'BAR-TH-104',
    processName: 'Chaudière biomasse',
    approvedDate: new Date('2024-11-10'),
    approvedBy: 'Marie Validator',
    primeAmount: 5500,
    billingStatus: 'billed',
    invoiceNumber: 'INV-2024-0156',
    invoiceDate: new Date('2024-11-12'),
    dueDate: new Date('2024-11-27'),
  },
  {
    id: 'billing-7',
    reference: 'VAL-2025-0082',
    beneficiaryName: 'Paul Roux',
    beneficiaryAddress: '78 Avenue Jean Jaurès',
    beneficiaryCity: '13001 Marseille',
    installerName: 'GreenEnergy Pro',
    installerId: 'inst-2',
    processCode: 'BAR-TH-171',
    processName: 'Pompe à chaleur air/eau',
    approvedDate: new Date('2024-11-15'),
    approvedBy: 'Pierre Admin',
    primeAmount: 4100,
    billingStatus: 'billed',
    invoiceNumber: 'INV-2024-0158',
    invoiceDate: new Date('2024-11-18'),
    dueDate: new Date('2024-12-03'),
  },
  // Paid
  {
    id: 'billing-8',
    reference: 'VAL-2025-0065',
    beneficiaryName: 'Marie Lefevre',
    beneficiaryAddress: '15 Rue des Fleurs',
    beneficiaryCity: '67000 Strasbourg',
    installerName: "Rénov'Habitat",
    installerId: 'inst-3',
    processCode: 'BAR-TH-106',
    processName: 'Chaudière haute performance',
    approvedDate: new Date('2024-11-01'),
    approvedBy: 'Marie Validator',
    primeAmount: 3600,
    billingStatus: 'paid',
    invoiceNumber: 'INV-2024-0145',
    invoiceDate: new Date('2024-11-03'),
    dueDate: new Date('2024-11-18'),
    paymentDate: new Date('2024-11-15'),
    paymentReference: 'VIR-20241115-001',
    paymentMethod: 'bank_transfer',
  },
  {
    id: 'billing-9',
    reference: 'VAL-2025-0068',
    beneficiaryName: 'Thomas Garcia',
    beneficiaryAddress: '42 Rue du Moulin',
    beneficiaryCity: '35000 Rennes',
    installerName: 'EcoTherm Solutions',
    installerId: 'inst-1',
    processCode: 'BAR-TH-171',
    processName: 'Pompe à chaleur air/eau',
    approvedDate: new Date('2024-11-05'),
    approvedBy: 'Pierre Admin',
    primeAmount: 4700,
    billingStatus: 'paid',
    invoiceNumber: 'INV-2024-0148',
    invoiceDate: new Date('2024-11-07'),
    dueDate: new Date('2024-11-22'),
    paymentDate: new Date('2024-11-20'),
    paymentReference: 'VIR-20241120-003',
    paymentMethod: 'bank_transfer',
  },
  {
    id: 'billing-10',
    reference: 'VAL-2025-0071',
    beneficiaryName: 'Isabelle Simon',
    beneficiaryAddress: '91 Boulevard Clemenceau',
    beneficiaryCity: '06000 Nice',
    installerName: 'GreenEnergy Pro',
    installerId: 'inst-2',
    processCode: 'BAR-TH-104',
    processName: 'Chaudière biomasse',
    approvedDate: new Date('2024-11-08'),
    approvedBy: 'Marie Validator',
    primeAmount: 5100,
    billingStatus: 'paid',
    invoiceNumber: 'INV-2024-0151',
    invoiceDate: new Date('2024-11-10'),
    dueDate: new Date('2024-11-25'),
    paymentDate: new Date('2024-11-22'),
    paymentReference: 'VIR-20241122-002',
    paymentMethod: 'bank_transfer',
  },
];

export const mockBillingActivities: BillingActivity[] = [
  {
    id: 'activity-1',
    dossierReference: 'VAL-2025-0071',
    dossierId: 'billing-10',
    installerName: 'GreenEnergy Pro',
    amount: 5100,
    action: 'paid',
    date: new Date('2024-11-22'),
    user: 'Admin User',
  },
  {
    id: 'activity-2',
    dossierReference: 'VAL-2025-0068',
    dossierId: 'billing-9',
    installerName: 'EcoTherm Solutions',
    amount: 4700,
    action: 'paid',
    date: new Date('2024-11-20'),
    user: 'Admin User',
  },
  {
    id: 'activity-3',
    dossierReference: 'VAL-2025-0082',
    dossierId: 'billing-7',
    installerName: 'GreenEnergy Pro',
    amount: 4100,
    action: 'billed',
    date: new Date('2024-11-18'),
    user: 'Marie Validator',
  },
  {
    id: 'activity-4',
    dossierReference: 'VAL-2025-0065',
    dossierId: 'billing-8',
    installerName: "Rénov'Habitat",
    amount: 3600,
    action: 'paid',
    date: new Date('2024-11-15'),
    user: 'Admin User',
  },
  {
    id: 'activity-5',
    dossierReference: 'VAL-2025-0078',
    dossierId: 'billing-6',
    installerName: 'EcoTherm Solutions',
    amount: 5500,
    action: 'billed',
    date: new Date('2024-11-12'),
    user: 'Pierre Admin',
  },
  {
    id: 'activity-6',
    dossierReference: 'VAL-2025-0071',
    dossierId: 'billing-10',
    installerName: 'GreenEnergy Pro',
    amount: 5100,
    action: 'billed',
    date: new Date('2024-11-10'),
    user: 'Marie Validator',
  },
];

export function getBillingSummary(month: number, year: number): BillingSummary {
  const approved = mockBillingDossiers.filter(d => d.billingStatus === 'approved');
  const billed = mockBillingDossiers.filter(d => 
    d.billingStatus === 'billed' || 
    (d.billingStatus === 'paid' && d.invoiceDate && 
     d.invoiceDate.getMonth() === month && d.invoiceDate.getFullYear() === year)
  );
  const paid = mockBillingDossiers.filter(d => 
    d.billingStatus === 'paid' && d.paymentDate &&
    d.paymentDate.getMonth() === month && d.paymentDate.getFullYear() === year
  );
  const outstanding = mockBillingDossiers.filter(d => d.billingStatus === 'billed');

  return {
    readyToBill: {
      count: approved.length,
      amount: approved.reduce((sum, d) => sum + d.primeAmount, 0),
    },
    billedThisMonth: {
      count: billed.length,
      amount: billed.reduce((sum, d) => sum + d.primeAmount, 0),
    },
    paidThisMonth: {
      count: paid.length,
      amount: paid.reduce((sum, d) => sum + d.primeAmount, 0),
    },
    outstanding: {
      count: outstanding.length,
      amount: outstanding.reduce((sum, d) => sum + d.primeAmount, 0),
    },
  };
}

export function getCEECalculation(dossierId: string): CEECalculation {
  const dossier = mockBillingDossiers.find(d => d.id === dossierId);
  const primeAmount = dossier?.primeAmount || 4500;
  const kWhCumac = Math.round(primeAmount / 0.0045);
  
  return {
    operationCode: dossier?.processCode || 'BAR-TH-171',
    climateZone: 'H1',
    heatedSurface: 120,
    buildingType: 'Maison individuelle',
    replacedEnergySource: 'Fioul',
    precarityStatus: 'Classique',
    kWhCumac,
    pricePerKWh: 0.0045,
    totalPrime: primeAmount,
  };
}

export function getPaymentBreakdown(dossierId: string): PaymentBreakdown {
  const dossier = mockBillingDossiers.find(d => d.id === dossierId);
  const totalAmount = dossier?.primeAmount || 4500;
  
  return {
    totalAmount,
    paymentOnValidation: totalAmount * 0.9,
    paymentOnEmmyDelivery: totalAmount * 0.1,
    paymentTerms: '15 jours à compter de la facture',
  };
}

export function getInstallerBillingInfo(installerId: string): InstallerBillingInfo {
  const installers: Record<string, InstallerBillingInfo> = {
    'inst-1': {
      companyName: 'EcoTherm Solutions',
      siret: '12345678901234',
      contactName: 'Jean Dupont',
      contactEmail: 'facturation@ecotherm.fr',
      contractReference: 'CTR-2024-001',
      contractPricing: '0.0045 €/kWh cumac',
    },
    'inst-2': {
      companyName: 'GreenEnergy Pro',
      siret: '98765432109876',
      contactName: 'Marie Martin',
      contactEmail: 'comptabilite@greenenergy.fr',
      contractReference: 'CTR-2024-002',
      contractPricing: '0.0048 €/kWh cumac',
    },
    'inst-3': {
      companyName: "Rénov'Habitat",
      siret: '45678901234567',
      contactName: 'Pierre Durand',
      contactEmail: 'finance@renovhabitat.fr',
      contractReference: 'CTR-2024-003',
      contractPricing: '0.0042 €/kWh cumac',
    },
  };
  
  return installers[installerId] || installers['inst-1'];
}

export function getCommunicationLog(dossierId: string): CommunicationLogEntry[] {
  const dossier = mockBillingDossiers.find(d => d.id === dossierId);
  const logs: CommunicationLogEntry[] = [];
  
  if (dossier?.invoiceDate) {
    logs.push({
      id: 'log-1',
      date: dossier.invoiceDate,
      action: 'invoice_generated',
      description: `Facture ${dossier.invoiceNumber} générée`,
      user: 'Marie Validator',
    });
    
    const sentDate = new Date(dossier.invoiceDate);
    sentDate.setHours(sentDate.getHours() + 2);
    logs.push({
      id: 'log-2',
      date: sentDate,
      action: 'invoice_sent',
      description: `Facture envoyée à ${getInstallerBillingInfo(dossier.installerId).contactEmail}`,
      user: 'Système',
    });
  }
  
  if (dossier?.paymentDate) {
    logs.push({
      id: 'log-3',
      date: dossier.paymentDate,
      action: 'payment_received',
      description: `Paiement reçu - Réf: ${dossier.paymentReference}`,
      user: 'Admin User',
    });
  } else if (dossier?.billingStatus === 'billed' && dossier.dueDate) {
    const reminderDate = new Date(dossier.dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    if (reminderDate < new Date()) {
      logs.push({
        id: 'log-3',
        date: reminderDate,
        action: 'payment_reminder',
        description: 'Rappel de paiement envoyé',
        user: 'Système',
      });
    }
  }
  
  return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
}
