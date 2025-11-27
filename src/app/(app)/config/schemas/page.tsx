'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockDocumentTypes } from '@/lib/mock-data/document-types';
import { Eye } from 'lucide-react';

type FieldSchema = {
  fieldName: string;
  displayName: string;
  documentType: string;
  dataType: string;
  required: boolean;
  crossReferences: string[];
  usageCount: number;
};

export default function FieldSchemaLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [dataTypeFilter, setDataTypeFilter] = useState('');
  const [showCrossRefOnly, setShowCrossRefOnly] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldSchema | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Flatten all fields from all document types
  const allFields: FieldSchema[] = mockDocumentTypes.flatMap((docType) =>
    docType.fieldSchema.map((field) => ({
      fieldName: field.internalName,
      displayName: field.displayName,
      documentType: docType.name,
      dataType: field.dataType,
      required: field.required,
      crossReferences: field.crossReferenceFields || [],
      usageCount: Math.floor(Math.random() * 1000), // Mock usage count
    }))
  );

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher un champ...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'docType',
      label: 'Type de document',
      type: 'select',
      placeholder: 'Tous les types',
      value: docTypeFilter,
      onChange: setDocTypeFilter,
      options: [
        { label: 'Tous les types', value: '' },
        ...Array.from(new Set(mockDocumentTypes.map(dt => dt.name))).map(name => ({
          label: name,
          value: name,
        })),
      ],
    },
    {
      id: 'dataType',
      label: 'Type de données',
      type: 'select',
      placeholder: 'Tous les types',
      value: dataTypeFilter,
      onChange: setDataTypeFilter,
      options: [
        { label: 'Tous les types', value: '' },
        { label: 'Texte', value: 'string' },
        { label: 'Nombre', value: 'integer' },
        { label: 'Décimal', value: 'decimal' },
        { label: 'Devise', value: 'currency' },
        { label: 'Date', value: 'date' },
        { label: 'Signature', value: 'signature' },
      ],
    },
  ];

  const filteredFields = allFields.filter((field) => {
    if (searchQuery && !field.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !field.displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (docTypeFilter && field.documentType !== docTypeFilter) {
      return false;
    }
    if (dataTypeFilter && field.dataType !== dataTypeFilter) {
      return false;
    }
    if (showCrossRefOnly && field.crossReferences.length === 0) {
      return false;
    }
    return true;
  });

  const columns: Column<FieldSchema>[] = [
    {
      key: 'fieldName',
      header: 'Nom du champ',
      cell: (field) => (
        <div className="font-mono text-sm">{field.fieldName}</div>
      ),
    },
    {
      key: 'displayName',
      header: 'Nom affiché',
      cell: (field) => <span>{field.displayName}</span>,
    },
    {
      key: 'documentType',
      header: 'Type de document',
      cell: (field) => (
        <Badge variant="outline">{field.documentType}</Badge>
      ),
    },
    {
      key: 'dataType',
      header: 'Type de données',
      cell: (field) => {
        const typeLabels: Record<string, string> = {
          string: 'Texte',
          integer: 'Nombre',
          decimal: 'Décimal',
          currency: 'Devise',
          date: 'Date',
          signature: 'Signature',
          email: 'Email',
          phone: 'Téléphone',
        };
        return <Badge variant="secondary">{typeLabels[field.dataType] || field.dataType}</Badge>;
      },
    },
    {
      key: 'required',
      header: 'Requis',
      cell: (field) => (
        field.required ? (
          <Badge variant="default" className="bg-red-600">Oui</Badge>
        ) : (
          <Badge variant="secondary">Non</Badge>
        )
      ),
    },
    {
      key: 'crossReferences',
      header: 'Références croisées',
      cell: (field) => (
        field.crossReferences.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {field.crossReferences.slice(0, 2).map((ref, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {ref}
              </Badge>
            ))}
            {field.crossReferences.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{field.crossReferences.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'usageCount',
      header: 'Utilisations',
      cell: (field) => (
        <span className="text-sm text-muted-foreground">{field.usageCount}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (field) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedField(field)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bibliothèque de schémas de champs</h1>
          <p className="text-muted-foreground">
            {filteredFields.length} champ{filteredFields.length > 1 ? 's' : ''} • Vue d'ensemble de tous les champs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCrossRefOnly}
              onChange={(e) => setShowCrossRefOnly(e.target.checked)}
              className="rounded"
            />
            Références croisées uniquement
          </label>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onClearAll={() => {
          setSearchQuery('');
          setDocTypeFilter('');
          setDataTypeFilter('');
          setShowCrossRefOnly(false);
        }}
      />

      <DataTable
        columns={columns}
        data={filteredFields}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredFields.length / pageSize)}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Field Detail Dialog */}
      <Dialog open={!!selectedField} onOpenChange={() => setSelectedField(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du champ</DialogTitle>
          </DialogHeader>
          {selectedField && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom du champ</p>
                  <p className="font-mono font-medium">{selectedField.fieldName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nom affiché</p>
                  <p className="font-medium">{selectedField.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type de document</p>
                  <Badge variant="outline">{selectedField.documentType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type de données</p>
                  <Badge variant="secondary">{selectedField.dataType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requis</p>
                  <Badge variant={selectedField.required ? 'default' : 'secondary'}>
                    {selectedField.required ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Utilisations</p>
                  <p className="font-medium">{selectedField.usageCount} dossiers</p>
                </div>
              </div>

              {selectedField.crossReferences.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Références croisées</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedField.crossReferences.map((ref, i) => (
                      <Badge key={i} variant="outline">
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button variant="outline" asChild>
                  <a href={`/config/document-types`}>
                    Modifier dans le type de document
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}