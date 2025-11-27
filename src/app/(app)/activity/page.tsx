'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Settings, 
  LogIn, 
  LogOut,
  FolderPlus 
} from 'lucide-react';
import { mockActivityEvents } from '@/lib/mock-data/activity';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type ActivityEvent = typeof mockActivityEvents[0];

const eventIcons = {
  dossier_created: FolderPlus,
  document_uploaded: Upload,
  dossier_validated: CheckCircle,
  dossier_approved: CheckCircle,
  dossier_rejected: XCircle,
  configuration_changed: Settings,
  user_login: LogIn,
  user_logout: LogOut,
};

const eventColors = {
  dossier_created: 'text-blue-600 bg-blue-50',
  document_uploaded: 'text-purple-600 bg-purple-50',
  dossier_validated: 'text-green-600 bg-green-50',
  dossier_approved: 'text-green-600 bg-green-50',
  dossier_rejected: 'text-red-600 bg-red-50',
  configuration_changed: 'text-orange-600 bg-orange-50',
  user_login: 'text-gray-600 bg-gray-50',
  user_logout: 'text-gray-600 bg-gray-50',
};

const eventLabels = {
  dossier_created: 'Dossier créé',
  document_uploaded: 'Document uploadé',
  dossier_validated: 'Dossier validé',
  dossier_approved: 'Dossier approuvé',
  dossier_rejected: 'Dossier rejeté',
  configuration_changed: 'Configuration modifiée',
  user_login: 'Connexion utilisateur',
  user_logout: 'Déconnexion utilisateur',
};

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher dans l\'activité...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'eventType',
      label: 'Type d\'événement',
      type: 'select',
      placeholder: 'Tous les types',
      value: eventTypeFilter,
      onChange: setEventTypeFilter,
      options: [
        { label: 'Tous les types', value: '' },
        { label: 'Dossier créé', value: 'dossier_created' },
        { label: 'Document uploadé', value: 'document_uploaded' },
        { label: 'Dossier validé', value: 'dossier_validated' },
        { label: 'Dossier approuvé', value: 'dossier_approved' },
        { label: 'Dossier rejeté', value: 'dossier_rejected' },
        { label: 'Configuration modifiée', value: 'configuration_changed' },
        { label: 'Connexion', value: 'user_login' },
        { label: 'Déconnexion', value: 'user_logout' },
      ],
    },
    {
      id: 'user',
      label: 'Utilisateur',
      type: 'select',
      placeholder: 'Tous les utilisateurs',
      value: userFilter,
      onChange: setUserFilter,
      options: [
        { label: 'Tous les utilisateurs', value: '' },
        ...Array.from(new Set(mockActivityEvents.map(e => e.userName))).map(name => ({
          label: name,
          value: name,
        })),
      ],
    },
  ];

  const filteredEvents = mockActivityEvents.filter((event) => {
    if (searchQuery && !event.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.userName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (eventTypeFilter && event.eventType !== eventTypeFilter) {
      return false;
    }
    if (userFilter && event.userName !== userFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal d'activité</h1>
          <p className="text-muted-foreground">
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onClearAll={() => {
          setSearchQuery('');
          setEventTypeFilter('');
          setUserFilter('');
        }}
      />

      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <ActivityEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function ActivityEventCard({ event }: { event: ActivityEvent }) {
  const Icon = eventIcons[event.eventType];
  const colorClass = eventColors[event.eventType];
  const label = eventLabels[event.eventType];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{label}</Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: fr })}
              </span>
            </div>
            <p className="text-sm font-medium">{event.description}</p>
            <p className="text-sm text-muted-foreground">Par {event.userName}</p>
            {event.details && Object.keys(event.details).length > 0 && (
              <details className="text-xs text-muted-foreground mt-2">
                <summary className="cursor-pointer hover:text-foreground">
                  Voir les détails
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(event.timestamp).toLocaleString('fr-FR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}