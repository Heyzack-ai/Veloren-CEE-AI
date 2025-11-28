'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Upload } from 'lucide-react';
import { mockDocumentTypes } from '@/lib/mock-data/document-types';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

type DocumentType = typeof mockDocumentTypes[0];

export default function DocumentTypesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: Filter[] = [
    {
      id: 'search',
      label: t('documentTypes.filter.search'),
      type: 'search',
      placeholder: t('documentTypes.filter.searchPlaceholder'),
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'category',
      label: t('documentTypes.filter.category'),
      type: 'select',
      placeholder: t('documentTypes.filter.categoryAll'),
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [
        { label: t('documentTypes.filter.categoryAll'), value: '' },
        { label: t('documentTypes.category.commercial'), value: 'commercial' },
        { label: t('documentTypes.category.legal'), value: 'legal' },
        { label: t('documentTypes.category.administrative'), value: 'administrative' },
        { label: t('documentTypes.category.technical'), value: 'technical' },
        { label: t('documentTypes.category.photos'), value: 'photos' },
      ],
    },
    {
      id: 'system',
      label: t('documentTypes.filter.type'),
      type: 'select',
      placeholder: t('documentTypes.filter.typeAll'),
      value: systemFilter,
      onChange: setSystemFilter,
      options: [
        { label: t('documentTypes.filter.typeAll'), value: '' },
        { label: t('documentTypes.filter.typeSystem'), value: 'system' },
        { label: t('documentTypes.filter.typeCustom'), value: 'custom' },
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
      header: t('documentTypes.table.code'),
      cell: (docType) => (
        <div className="font-medium">{docType.code}</div>
      ),
    },
    {
      key: 'name',
      header: t('documentTypes.table.name'),
      cell: (docType) => <span>{docType.name}</span>,
    },
    {
      key: 'category',
      header: t('documentTypes.table.category'),
      cell: (docType) => {
        return <Badge variant="outline">{t(`documentTypes.category.${docType.category}`)}</Badge>;
      },
    },
    {
      key: 'fields',
      header: t('documentTypes.table.fields'),
      cell: (docType) => (
        <span className="text-sm text-muted-foreground">
          {t('documentTypes.stats.fields', { count: docType.fieldSchema.length })}
        </span>
      ),
    },
    {
      key: 'rules',
      header: t('documentTypes.table.rules'),
      cell: (docType) => (
        <span className="text-sm text-muted-foreground">
          {t('documentTypes.stats.rules', { count: docType.ruleCount })}
        </span>
      ),
    },
    {
      key: 'system',
      header: t('documentTypes.table.system'),
      cell: (docType) => (
        docType.isSystem ? (
          <Badge variant="secondary">{t('documentTypes.badge.system')}</Badge>
        ) : (
          <Badge variant="outline">{t('documentTypes.badge.custom')}</Badge>
        )
      ),
    },
    {
      key: 'status',
      header: t('documentTypes.table.status'),
      cell: (docType) => (
        docType.isActive ? (
          <Badge variant="default" className="bg-green-600">{t('common.active')}</Badge>
        ) : (
          <Badge variant="secondary">{t('common.inactive')}</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: t('documentTypes.table.actions'),
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
          <h1 className="text-3xl font-bold tracking-tight">{t('documentTypes.title')}</h1>
          <p className="text-muted-foreground">
            {t('documentTypes.subtitle', {
              count: filteredDocumentTypes.length,
              plural: filteredDocumentTypes.length > 1 ? 's' : ''
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {t('documentTypes.import')}
          </Button>
          <Button asChild>
            <Link href="/config/document-types/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('documentTypes.create')}
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