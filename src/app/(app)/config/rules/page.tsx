'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Copy, Upload } from 'lucide-react';
import { mockValidationRules } from '@/lib/mock-data/validation-rules';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ValidationRule = typeof mockValidationRules[0];

export default function ValidationRulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher une règle...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'severity',
      label: 'Sévérité',
      type: 'select',
      placeholder: 'Toutes les sévérités',
      value: severityFilter,
      onChange: setSeverityFilter,
      options: [
        { label: 'Toutes les sévérités', value: '' },
        { label: 'Erreur', value: 'error' },
        { label: 'Avertissement', value: 'warning' },
        { label: 'Info', value: 'info' },
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
        { label: 'Tous les statuts', value: '' },
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
      ],
    },
  ];

  const filteredRules = mockValidationRules.filter((rule) => {
    if (searchQuery && !rule.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !rule.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (severityFilter && rule.severity !== severityFilter) {
      return false;
    }
    if (statusFilter) {
      if (statusFilter === 'active' && !rule.isActive) return false;
      if (statusFilter === 'inactive' && rule.isActive) return false;
    }
    if (activeTab !== 'all' && rule.type !== activeTab) {
      return false;
    }
    return true;
  });

  const columns: Column<ValidationRule>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (rule) => (
        <div className="font-medium">{rule.code}</div>
      ),
    },
    {
      key: 'name',
      header: 'Nom',
      cell: (rule) => <span>{rule.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (rule) => {
        const typeLabels = {
          document: 'Document',
          cross_document: 'Inter-documents',
          global: 'Global',
        };
        return <Badge variant="outline">{typeLabels[rule.type]}</Badge>;
      },
    },
    {
      key: 'severity',
      header: 'Sévérité',
      cell: (rule) => {
        const severityConfig = {
          error: { label: 'Erreur', className: 'bg-red-600' },
          warning: { label: 'Avertissement', className: 'bg-yellow-600' },
          info: { label: 'Info', className: 'bg-blue-600' },
        };
        const config = severityConfig[rule.severity];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
    },
    {
      key: 'appliesTo',
      header: 'S\'applique à',
      cell: (rule) => (
        <div className="flex flex-wrap gap-1">
          {rule.appliesTo.documentTypes?.slice(0, 2).map((docType) => (
            <Badge key={docType} variant="secondary" className="text-xs">
              {docType}
            </Badge>
          ))}
          {rule.appliesTo.documentTypes && rule.appliesTo.documentTypes.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{rule.appliesTo.documentTypes.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Statistiques',
      cell: (rule) => (
        <div className="text-xs text-muted-foreground">
          <div>{rule.passedCount}/{rule.timesEvaluated} réussis</div>
          <div className="text-red-600">{rule.overrideCount} contournements</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Actif',
      cell: (rule) => (
        <Switch checked={rule.isActive} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (rule) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/config/rules/${rule.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Règles de validation</h1>
          <p className="text-muted-foreground">
            {filteredRules.length} règle{filteredRules.length > 1 ? 's' : ''} configurée{filteredRules.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer des règles
          </Button>
          <Button asChild>
            <Link href="/config/rules/new">
              <Plus className="h-4 w-4 mr-2" />
              Créer une règle
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Toutes les règles ({mockValidationRules.length})
          </TabsTrigger>
          <TabsTrigger value="document">
            Règles document ({mockValidationRules.filter(r => r.type === 'document').length})
          </TabsTrigger>
          <TabsTrigger value="cross_document">
            Règles inter-documents ({mockValidationRules.filter(r => r.type === 'cross_document').length})
          </TabsTrigger>
          <TabsTrigger value="global">
            Règles globales ({mockValidationRules.filter(r => r.type === 'global').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <FilterBar
            filters={filters}
            onClearAll={() => {
              setSearchQuery('');
              setSeverityFilter('');
              setStatusFilter('');
            }}
          />

          <DataTable
            columns={columns}
            data={filteredRules}
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRules.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}