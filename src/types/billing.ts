export type BillingStatus = 'approved' | 'billed' | 'paid';

export type PaymentMethod = 'bank_transfer' | 'check' | 'other';

export type BillingAction = 'invoice_generated' | 'invoice_sent' | 'payment_reminder' | 'payment_received';

export type BillingDossier = {
  id: string;
  reference: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  beneficiaryCity: string;
  installerName: string;
  installerId: string;
  processCode: string;
  processName: string;
  approvedDate: Date;
  approvedBy: string;
  primeAmount: number;
  billingStatus: BillingStatus;
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  paymentDate?: Date;
  paymentReference?: string;
  paymentMethod?: PaymentMethod;
};

export type CEECalculation = {
  operationCode: string;
  climateZone: string;
  heatedSurface: number;
  buildingType: string;
  replacedEnergySource: string;
  precarityStatus: string;
  kWhCumac: number;
  pricePerKWh: number;
  totalPrime: number;
};

export type PaymentBreakdown = {
  totalAmount: number;
  paymentOnValidation: number; // 90%
  paymentOnEmmyDelivery: number; // 10%
  paymentTerms: string;
};

export type InstallerBillingInfo = {
  companyName: string;
  siret: string;
  contactName: string;
  contactEmail: string;
  contractReference: string;
  contractPricing: string;
};

export type CommunicationLogEntry = {
  id: string;
  date: Date;
  action: BillingAction;
  description: string;
  user: string;
};

export type BillingActivity = {
  id: string;
  dossierReference: string;
  dossierId: string;
  installerName: string;
  amount: number;
  action: 'billed' | 'paid';
  date: Date;
  user: string;
};

export type BillingSummary = {
  readyToBill: { count: number; amount: number };
  billedThisMonth: { count: number; amount: number };
  paidThisMonth: { count: number; amount: number };
  outstanding: { count: number; amount: number };
};
