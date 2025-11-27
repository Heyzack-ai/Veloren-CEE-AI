'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Plus, FileText, CheckSquare, Folder, Edit, Copy, Archive } from 'lucide-react';
import { mockProcesses } from '@/lib/mock-data/processes';
import { Process } from '@/types/process';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProcessesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher un processus...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'category',
      label: 'Catégorie',
      type: 'select',
      placeholder: 'Toutes les catégories',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [
        { label: 'Toutes les catégories', value: '' },
        { label: 'CEE Résidentiel', value: 'cee_residential' },
        { label: 'CEE Tertiaire', value: 'cee_tertiary' },
        { label: 'CEE Industriel', value: 'cee_industrial' },
        { label: 'Personnalisé', value: 'custom' },
      ],
    },
    {
      id: 'status',
      label: 'Statut',
      type: 'select',
      placeholder: 'Tous les statuts',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Tous', value: '' },
        { label: 'Actif', value: 'active' },
        { label: 'Brouillon', value: 'draft' },
      ],
    },
  ];

  const filteredProcesses = mockProcesses.filter((process) => {
    if (searchQuery && !process.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !process.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter && process.category !== categoryFilter) {
      return false;
    }
    if (statusFilter) {
      const isActive = process.isActive;
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'draft' && isActive) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processus</h1>
          <p className="text-muted-foreground">
            {filteredProcesses.length} processus configuré{filteredProcesses.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Importer un modèle
          </Button>
          <Button asChild>
            <Link href="/config/processes/new">
              <Plus className="h-4 w-4 mr-2" />
              Créer un processus
            </Link>
          </Button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onClearAll={() => {
          setSearchQuery('');
          setCategoryFilter('');
          setStatusFilter('');
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProcesses.map((process) => (
          <ProcessCard key={process.id} process={process} />
        ))}
      </div>
    </div>
  );
}

function ProcessCard({ process }: { process: Process }) {
  const categoryLabels = {
    cee_residential: 'CEE Résidentiel',
    cee_tertiary: 'CEE Tertiaire',
    cee_industrial: 'CEE Industriel',
    custom: 'Personnalisé',
  };

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        process.isActive && 'border-l-4 border-l-green-500'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{process.code}</CardTitle>
            <p className="text-sm text-muted-foreground">{process.name}</p>
          </div>
          <div className="flex gap-1">
            {process.isActive ? (
              <Badge variant="default" className="bg-green-600">Actif</Badge>
            ) : (
              <Badge variant="secondary">Brouillon</Badge>
            )}
            {process.isCoupDePouce && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                Coup de pouce
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{process.documentCount} documents</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckSquare className="h-4 w-4" />
            <span>{process.ruleCount} règles</span>
          </div>
          <div className="flex items-center gap-1">
            <Folder className="h-4 w-4" />
            <span>{process.dossierCount} dossiers</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            <p>Version {process.version}</p>
            <p>Mis à jour le {new Date(process.updatedAt).toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/config/processes/${process.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}