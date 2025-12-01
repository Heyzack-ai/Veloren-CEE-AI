'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, FileText, Upload } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { mockDocuments, type DocumentRecord } from '@/lib/mock-data/documents';

type Document = DocumentRecord;

const filters: Filter[] = [
  {
    id: 'search',
    label: 'Recherche',
    type: 'search',
    placeholder: 'Rechercher par référence, nom de fichier...',
    value: '',
    onChange: () => {},
  },
  {
    id: 'status',
    label: 'Statut',
    type: 'select',
    placeholder: 'Tous les statuts',
    value: '',
    onChange: () => {},
    options: [
      { label: 'Tous les statuts', value: '' },
      { label: 'Traitement en cours', value: 'processing' },
      { label: 'Terminé', value: 'completed' },
      { label: 'Erreur', value: 'error' },
    ],
  },
  {
    id: 'type',
    label: 'Type de document',
    type: 'select',
    placeholder: 'Tous les types',
    value: '',
    onChange: () => {},
    options: [
      { label: 'Tous les types', value: '' },
      { label: 'Devis', value: 'Devis' },
      { label: 'Facture', value: 'Facture' },
      { label: 'Attestation sur l\'honneur', value: 'AH' },
      { label: 'Cadre de contribution', value: 'CDC' },
      { label: 'Photos', value: 'Photos' },
    ],
  },
];

const columns: Column<Document>[] = [
  {
    key: 'dossierRef',
    header: 'Référence dossier',
    cell: (doc) => (
      <Link
        href={`/documents/${doc.id}`}
        className="font-medium text-blue-600 hover:underline cursor-pointer"
      >
        {doc.dossierRef}
      </Link>
    ),
  },
  {
    key: 'documentType',
    header: 'Type',
    cell: (doc) => (
      <Badge variant="outline">{doc.documentType}</Badge>
    ),
  },
  {
    key: 'fileName',
    header: 'Nom du fichier',
    cell: (doc) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="truncate max-w-[200px]">{doc.fileName}</span>
      </div>
    ),
  },
  {
    key: 'installer',
    header: 'Installateur',
    cell: (doc) => <span>{doc.installer}</span>,
  },
  {
    key: 'status',
    header: 'Statut',
    cell: (doc) => <StatusBadge status={doc.status} />,
  },
  {
    key: 'confidence',
    header: 'Confiance',
    cell: (doc) => (
      doc.status === 'completed' ? (
        <ConfidenceIndicator value={doc.confidence} />
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )
    ),
  },
  {
    key: 'uploadDate',
    header: 'Date d\'upload',
    cell: (doc) => (
      <span className="text-sm text-muted-foreground">
        {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
      </span>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    cell: (doc) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/documents/${doc.id}`} aria-label="Voir le document">
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log('Download document', doc.id)}
          aria-label="Télécharger le document"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher par référence, nom de fichier...',
      value: searchQuery,
      onChange: setSearchQuery,
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
        { label: 'Traitement en cours', value: 'processing' },
        { label: 'Terminé', value: 'completed' },
        { label: 'Erreur', value: 'error' },
      ],
    },
    {
      id: 'type',
      label: 'Type de document',
      type: 'select',
      placeholder: 'Tous les types',
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { label: 'Tous les types', value: '' },
        { label: 'Devis', value: 'Devis' },
        { label: 'Facture', value: 'Facture' },
        { label: 'Attestation sur l\'honneur', value: 'AH' },
        { label: 'Cadre de contribution', value: 'CDC' },
        { label: 'Photos', value: 'Photos' },
      ],
    },
  ];

  const filteredDocuments = mockDocuments.filter((doc) => {
    if (searchQuery && !doc.dossierRef.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter && doc.status !== statusFilter) {
      return false;
    }
    if (typeFilter && doc.documentType !== typeFilter) {
      return false;
    }
    return true;
  });

  const columns: Column<Document>[] = [
    {
      key: 'dossierRef',
      header: 'Référence dossier',
      cell: (doc) => (
        <Link
          href={`/documents/${doc.id}`}
          className="font-medium text-blue-600 hover:underline cursor-pointer"
        >
          {doc.dossierRef}
        </Link>
      ),
    },
    {
      key: 'documentType',
      header: 'Type',
      cell: (doc) => (
        <Badge variant="outline">{doc.documentType}</Badge>
      ),
    },
    {
      key: 'fileName',
      header: 'Nom du fichier',
      cell: (doc) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="truncate max-w-[200px]">{doc.fileName}</span>
        </div>
      ),
    },
    {
      key: 'installer',
      header: 'Installateur',
      cell: (doc) => <span>{doc.installer}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (doc) => <StatusBadge status={doc.status} />,
    },
    {
      key: 'confidence',
      header: 'Confiance',
      cell: (doc) => (
        doc.status === 'completed' ? (
          <ConfidenceIndicator value={doc.confidence} />
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'uploadDate',
      header: 'Date d\'upload',
      cell: (doc) => (
        <span className="text-sm text-muted-foreground">
          {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (doc) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/documents/${doc.id}`} aria-label="Voir le document">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Download document', doc.id)}
            aria-label="Télécharger le document"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Importer des documents
        </Button>
      </div>

      <FilterBar
        filters={filters}
        onClearAll={() => {
          setSearchQuery('');
          setStatusFilter('');
          setTypeFilter('');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredDocuments}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredDocuments.length / pageSize)}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}