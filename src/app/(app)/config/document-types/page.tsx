'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Upload } from 'lucide-react';
import { mockDocumentTypes } from '@/lib/mock-data/document-types';
import Link from 'next/link';

type DocumentType = typeof mockDocumentTypes[0];

export default function DocumentTypesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher un type de document...',
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
        { label: 'Documents commerciaux', value: 'commercial' },
        { label: 'Documents légaux', value: 'legal' },
        { label: 'Documents administratifs', value: 'administrative' },
        { label: 'Documents techniques', value: 'technical' },
        { label: 'Photos', value: 'photos' },
      ],
    },
    {
      id: 'system',
      label: 'Type',
      type: 'select',
      placeholder: 'Tous',
      value: systemFilter,
      onChange: setSystemFilter,
      options: [
        { label: 'Tous', value: '' },
        { label: 'Système', value: 'system' },
        { label: 'Personnalisé', value: 'custom' },
      ],
    },
  ];

  const filteredDocumentTypes = mockDocumentTypes.filter((docType) => {
    if (searchQuery && !docType.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !docType.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter && docType.category !== categoryFilter) {
      return false;
    }
    if (systemFilter) {
      if (systemFilter === 'system' && !docType.isSystem) return false;
      if (systemFilter === 'custom' && docType.isSystem) return false;
    }
    return true;
  });

  const columns: Column<DocumentType>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (docType) => (
        <div className="font-medium">{docType.code}</div>
      ),
    },
    {
      key: 'name',
      header: 'Nom',
      cell: (docType) => <span>{docType.name}</span>,
    },
    {
      key: 'category',
      header: 'Catégorie',
      cell: (docType) => {
        const categoryLabels: Record<string, string> = {
          commercial: 'Commercial',
          legal: 'Légal',
          administrative: 'Administratif',
          technical: 'Technique',
          photos: 'Photos',
        };
        return <Badge variant="outline">{categoryLabels[docType.category]}</Badge>;
      },
    },
    {
      key: 'fields',
      header: 'Champs',
      cell: (docType) => (
        <span className="text-sm text-muted-foreground">
          {docType.fieldSchema.length} champs
        </span>
      ),
    },
    {
      key: 'rules',
      header: 'Règles',
      cell: (docType) => (
        <span className="text-sm text-muted-foreground">
          {docType.ruleCount} règles
        </span>
      ),
    },
    {
      key: 'system',
      header: 'Système',
      cell: (docType) => (
        docType.isSystem ? (
          <Badge variant="secondary">Système</Badge>
        ) : (
          <Badge variant="outline">Personnalisé</Badge>
        )
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (docType) => (
        docType.isActive ? (
          <Badge variant="default" className="bg-green-600">Actif</Badge>
        ) : (
          <Badge variant="secondary">Inactif</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (docType) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/config/document-types/${docType.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Types de documents</h1>
          <p className="text-muted-foreground">
            {filteredDocumentTypes.length} type{filteredDocumentTypes.length > 1 ? 's' : ''} de document
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button asChild>
            <Link href="/config/document-types/new">
              <Plus className="h-4 w-4 mr-2" />
              Créer un type
            </Link>
          </Button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onClearAll={() => {
          setSearchQuery('');
          setCategoryFilter('');
          setSystemFilter('');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredDocumentTypes}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredDocumentTypes.length / pageSize)}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}