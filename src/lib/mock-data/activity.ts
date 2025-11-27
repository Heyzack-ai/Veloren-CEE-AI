export type ActivityEventType =
  | 'dossier_created'
  | 'document_uploaded'
  | 'dossier_validated'
  | 'dossier_approved'
  | 'dossier_rejected'
  | 'configuration_changed'
  | 'user_login'
  | 'user_logout';

export type ActivityEvent = {
  id: string;
  timestamp: Date;
  eventType: ActivityEventType;
  userId: string;
  userName: string;
  description: string;
  details?: Record<string, any>;
};

export const mockActivityEvents: ActivityEvent[] = [
  {
    id: 'evt1',
    timestamp: new Date('2024-11-25T10:45:00Z'),
    eventType: 'dossier_approved',
    userId: 'user3',
    userName: 'Sophie Bernard',
    description: 'Dossier VAL-2025-1234 approuvé',
    details: {
      dossierId: 'doss-1',
      dossierRef: 'VAL-2025-1234',
    },
  },
  {
    id: 'evt2',
    timestamp: new Date('2024-11-25T10:30:00Z'),
    eventType: 'document_uploaded',
    userId: 'user1',
    userName: 'Marie Dubois',
    description: 'Document Facture uploadé pour VAL-2025-1235',
    details: {
      dossierId: 'doss-2',
      documentType: 'Facture',
    },
  },
  {
    id: 'evt3',
    timestamp: new Date('2024-11-25T10:15:00Z'),
    eventType: 'dossier_created',
    userId: 'inst1',
    userName: 'Jean Dupont',
    description: 'Nouveau dossier VAL-2025-1236 créé',
    details: {
      dossierId: 'doss-3',
      processCode: 'BAR-TH-171',
    },
  },
  {
    id: 'evt4',
    timestamp: new Date('2024-11-25T09:50:00Z'),
    eventType: 'dossier_validated',
    userId: 'user4',
    userName: 'Thomas Petit',
    description: 'Dossier VAL-2025-1230 validé',
    details: {
      dossierId: 'doss-4',
      outcome: 'approved',
    },
  },
  {
    id: 'evt5',
    timestamp: new Date('2024-11-25T09:30:00Z'),
    eventType: 'configuration_changed',
    userId: 'user1',
    userName: 'Marie Dubois',
    description: 'Règle de validation PRIME_CONSISTENCY modifiée',
    details: {
      ruleId: 'rule1',
      changes: {
        severity: 'error',
      },
    },
  },
  {
    id: 'evt6',
    timestamp: new Date('2024-11-25T09:15:00Z'),
    eventType: 'user_login',
    userId: 'user1',
    userName: 'Marie Dubois',
    description: 'Connexion utilisateur',
    details: {
      ipAddress: '192.168.1.100',
    },
  },
  {
    id: 'evt7',
    timestamp: new Date('2024-11-25T09:00:00Z'),
    eventType: 'dossier_rejected',
    userId: 'user5',
    userName: 'Julie Moreau',
    description: 'Dossier VAL-2025-1228 rejeté',
    details: {
      dossierId: 'doss-5',
      reason: 'Signatures manquantes',
    },
  },
  {
    id: 'evt8',
    timestamp: new Date('2024-11-25T08:45:00Z'),
    eventType: 'document_uploaded',
    userId: 'inst2',
    userName: 'Marie Lambert',
    description: 'Document Devis uploadé pour VAL-2025-1237',
    details: {
      dossierId: 'doss-6',
      documentType: 'Devis',
    },
  },
  {
    id: 'evt9',
    timestamp: new Date('2024-11-25T08:30:00Z'),
    eventType: 'dossier_approved',
    userId: 'user3',
    userName: 'Sophie Bernard',
    description: 'Dossier VAL-2025-1225 approuvé',
    details: {
      dossierId: 'doss-7',
      dossierRef: 'VAL-2025-1225',
    },
  },
  {
    id: 'evt10',
    timestamp: new Date('2024-11-25T08:15:00Z'),
    eventType: 'user_login',
    userId: 'user4',
    userName: 'Thomas Petit',
    description: 'Connexion utilisateur',
    details: {
      ipAddress: '192.168.1.105',
    },
  },
  {
    id: 'evt11',
    timestamp: new Date('2024-11-25T08:00:00Z'),
    eventType: 'dossier_created',
    userId: 'inst3',
    userName: 'Pierre Rousseau',
    description: 'Nouveau dossier VAL-2025-1238 créé',
    details: {
      dossierId: 'doss-8',
      processCode: 'BAR-EN-101',
    },
  },
  {
    id: 'evt12',
    timestamp: new Date('2024-11-24T17:45:00Z'),
    eventType: 'dossier_validated',
    userId: 'user6',
    userName: 'Laurent Durand',
    description: 'Dossier VAL-2025-1220 validé',
    details: {
      dossierId: 'doss-9',
      outcome: 'approved',
    },
  },
  {
    id: 'evt13',
    timestamp: new Date('2024-11-24T17:30:00Z'),
    eventType: 'configuration_changed',
    userId: 'user2',
    userName: 'Pierre Martin',
    description: 'Type de document DEVIS modifié',
    details: {
      documentTypeId: 'dt1',
      changes: {
        fieldSchema: 'updated',
      },
    },
  },
  {
    id: 'evt14',
    timestamp: new Date('2024-11-24T17:15:00Z'),
    eventType: 'document_uploaded',
    userId: 'inst5',
    userName: 'Luc Bertrand',
    description: 'Document AH uploadé pour VAL-2025-1239',
    details: {
      dossierId: 'doss-10',
      documentType: 'AH',
    },
  },
  {
    id: 'evt15',
    timestamp: new Date('2024-11-24T17:00:00Z'),
    eventType: 'dossier_approved',
    userId: 'user3',
    userName: 'Sophie Bernard',
    description: 'Dossier VAL-2025-1215 approuvé',
    details: {
      dossierId: 'doss-11',
      dossierRef: 'VAL-2025-1215',
    },
  },
];

export function getEventsByType(eventType: ActivityEventType): ActivityEvent[] {
  return mockActivityEvents.filter(e => e.eventType === eventType);
}

export function getEventsByUser(userId: string): ActivityEvent[] {
  return mockActivityEvents.filter(e => e.userId === userId);
}

export function getRecentEvents(limit: number = 10): ActivityEvent[] {
  return mockActivityEvents.slice(0, limit);
}