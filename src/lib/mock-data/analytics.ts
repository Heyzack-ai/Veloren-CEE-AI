export type AnalyticsData = {
  keyMetrics: {
    totalProcessed: number;
    approvalRate: number;
    averageProcessingTime: number;
    aiAccuracyRate: number;
    rejectionRate: number;
  };
  dossiersOverTime: {
    date: string;
    submitted: number;
    approved: number;
    rejected: number;
  }[];
  processingTimeDistribution: {
    range: string;
    count: number;
  }[];
  accuracyByDocumentType: {
    documentType: string;
    accuracy: number;
  }[];
  performanceByInstaller: {
    installerName: string;
    dossiersSubmitted: number;
    approvalRate: number;
    averageIssues: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  validatorPerformance: {
    validatorName: string;
    dossiersValidated: number;
    averageTimePerDossier: number;
    accuracyRate: number;
    overridesMade: number;
  }[];
};

export const mockAnalyticsData: AnalyticsData = {
  keyMetrics: {
    totalProcessed: 1247,
    approvalRate: 89.5,
    averageProcessingTime: 4.2,
    aiAccuracyRate: 94.3,
    rejectionRate: 10.5,
  },
  dossiersOverTime: [
    { date: '2024-11-01', submitted: 42, approved: 38, rejected: 4 },
    { date: '2024-11-02', submitted: 38, approved: 34, rejected: 4 },
    { date: '2024-11-03', submitted: 35, approved: 31, rejected: 4 },
    { date: '2024-11-04', submitted: 45, approved: 40, rejected: 5 },
    { date: '2024-11-05', submitted: 50, approved: 45, rejected: 5 },
    { date: '2024-11-06', submitted: 48, approved: 43, rejected: 5 },
    { date: '2024-11-07', submitted: 52, approved: 47, rejected: 5 },
    { date: '2024-11-08', submitted: 41, approved: 37, rejected: 4 },
    { date: '2024-11-09', submitted: 39, approved: 35, rejected: 4 },
    { date: '2024-11-10', submitted: 36, approved: 32, rejected: 4 },
    { date: '2024-11-11', submitted: 44, approved: 39, rejected: 5 },
    { date: '2024-11-12', submitted: 47, approved: 42, rejected: 5 },
    { date: '2024-11-13', submitted: 49, approved: 44, rejected: 5 },
    { date: '2024-11-14', submitted: 51, approved: 46, rejected: 5 },
    { date: '2024-11-15', submitted: 43, approved: 38, rejected: 5 },
    { date: '2024-11-16', submitted: 40, approved: 36, rejected: 4 },
    { date: '2024-11-17', submitted: 37, approved: 33, rejected: 4 },
    { date: '2024-11-18', submitted: 46, approved: 41, rejected: 5 },
    { date: '2024-11-19', submitted: 48, approved: 43, rejected: 5 },
    { date: '2024-11-20', submitted: 50, approved: 45, rejected: 5 },
    { date: '2024-11-21', submitted: 53, approved: 48, rejected: 5 },
    { date: '2024-11-22', submitted: 45, approved: 40, rejected: 5 },
    { date: '2024-11-23', submitted: 42, approved: 38, rejected: 4 },
    { date: '2024-11-24', submitted: 39, approved: 35, rejected: 4 },
    { date: '2024-11-25', submitted: 34, approved: 30, rejected: 4 },
  ],
  processingTimeDistribution: [
    { range: '0-2h', count: 245 },
    { range: '2-4h', count: 412 },
    { range: '4-6h', count: 328 },
    { range: '6-8h', count: 156 },
    { range: '8-12h', count: 78 },
    { range: '12-24h', count: 28 },
  ],
  accuracyByDocumentType: [
    { documentType: 'Devis', accuracy: 96.2 },
    { documentType: 'Facture', accuracy: 95.8 },
    { documentType: 'AH', accuracy: 92.5 },
    { documentType: 'CDC', accuracy: 93.7 },
    { documentType: 'Photos', accuracy: 88.4 },
  ],
  performanceByInstaller: [
    {
      installerName: 'EcoTherm Solutions',
      dossiersSubmitted: 145,
      approvalRate: 91.7,
      averageIssues: 0.8,
      trend: 'up',
    },
    {
      installerName: 'GreenEnergy Pro',
      dossiersSubmitted: 234,
      approvalRate: 93.2,
      averageIssues: 0.6,
      trend: 'up',
    },
    {
      installerName: 'Isolation Plus',
      dossiersSubmitted: 89,
      approvalRate: 87.6,
      averageIssues: 1.2,
      trend: 'stable',
    },
    {
      installerName: 'Renov\'Habitat',
      dossiersSubmitted: 178,
      approvalRate: 88.8,
      averageIssues: 1.0,
      trend: 'up',
    },
    {
      installerName: 'ÉcoConfort Services',
      dossiersSubmitted: 67,
      approvalRate: 88.1,
      averageIssues: 1.1,
      trend: 'stable',
    },
  ],
  validatorPerformance: [
    {
      validatorName: 'Sophie Bernard',
      dossiersValidated: 312,
      averageTimePerDossier: 3.8,
      accuracyRate: 96.5,
      overridesMade: 18,
    },
    {
      validatorName: 'Thomas Petit',
      dossiersValidated: 289,
      averageTimePerDossier: 4.2,
      accuracyRate: 95.2,
      overridesMade: 22,
    },
    {
      validatorName: 'Julie Moreau',
      dossiersValidated: 267,
      averageTimePerDossier: 4.5,
      accuracyRate: 94.8,
      overridesMade: 25,
    },
    {
      validatorName: 'Laurent Durand',
      dossiersValidated: 234,
      averageTimePerDossier: 4.1,
      accuracyRate: 95.7,
      overridesMade: 19,
    },
  ],
};