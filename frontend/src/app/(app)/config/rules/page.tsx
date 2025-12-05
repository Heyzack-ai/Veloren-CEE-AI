'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Copy, Upload } from 'lucide-react';
import { mockValidationRules } from '@/lib/mock-data/validation-rules';
import { mockProcesses } from '@/lib/mock-data/processes';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';

type ValidationRule = typeof mockValidationRules[0];

export default function ValidationRulesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: Filter[] = [
    {
      id: 'search',
      label: t('rules.filter.search'),
      type: 'search',
      placeholder: t('rules.filter.searchPlaceholder'),
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'severity',
      label: t('rules.filter.severity'),
      type: 'select',
      placeholder: t('rules.filter.severityAll'),
      value: severityFilter,
      onChange: setSeverityFilter,
      options: [
        { label: t('rules.filter.severityAll'), value: '' },
        { label: t('rules.severity.error'), value: 'error' },
        { label: t('rules.severity.warning'), value: 'warning' },
        { label: t('rules.severity.info'), value: 'info' },
      ],
    },
    {
      id: 'status',
      label: t('common.status'),
      type: 'select',
      placeholder: t('rules.filter.statusAll'),
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: t('rules.filter.statusAll'), value: '' },
        { label: t('common.active'), value: 'active' },
        { label: t('common.inactive'), value: 'inactive' },
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
      header: t('rules.table.code'),
      cell: (rule) => (
        <div className="font-medium">{rule.code}</div>
      ),
    },
    {
      key: 'name',
      header: t('rules.table.name'),
      cell: (rule) => <span>{rule.name}</span>,
    },
    {
      key: 'type',
      header: t('rules.table.type'),
      cell: (rule) => {
        return <Badge variant="outline">{t(`rules.type.${rule.type}`)}</Badge>;
      },
    },
    {
      key: 'severity',
      header: t('rules.table.severity'),
      cell: (rule) => {
        const severityConfig = {
          error: { className: 'bg-red-600' },
          warning: { className: 'bg-yellow-600' },
          info: { className: 'bg-blue-600' },
        };
        const config = severityConfig[rule.severity];
        return <Badge className={config.className}>{t(`rules.severity.${rule.severity}`)}</Badge>;
      },
    },
    {
      key: 'appliesTo',
      header: t('rules.table.appliesTo'),
      cell: (rule) => {
        // Get process codes from IDs
        const processTypes = rule.appliesTo.processTypes || [];
        const processCodes = processTypes.map(id => {
          const process = mockProcesses.find(p => p.id === id);
          return process?.code || id;
        });

        return (
          <div className="flex flex-col gap-1">
            {/* Document Types */}
            {rule.appliesTo.documentTypes && rule.appliesTo.documentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {rule.appliesTo.documentTypes.slice(0, 2).map((docType) => (
                  <Badge key={docType} variant="secondary" className="text-xs">
                    {docType}
                  </Badge>
                ))}
                {rule.appliesTo.documentTypes.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{rule.appliesTo.documentTypes.length - 2}
                  </Badge>
                )}
              </div>
            )}
            {/* Process Types */}
            <div className="flex flex-wrap gap-1">
              {processTypes.length === 0 ? (
                <span className="text-xs text-muted-foreground">{t('rules.table.allProcesses')}</span>
              ) : (
                <>
                  {processCodes.slice(0, 2).map((code) => (
                    <Badge key={code} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {code}
                    </Badge>
                  ))}
                  {processCodes.length > 2 && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      +{processCodes.length - 2}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'stats',
      header: t('rules.table.statistics'),
      cell: (rule) => (
        <div className="text-xs text-muted-foreground">
          <div>{t('rules.stats.passed', { passed: rule.passedCount, total: rule.timesEvaluated })}</div>
          <div className="text-red-600">{t('rules.stats.overrides', { count: rule.overrideCount })}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('rules.table.active'),
      cell: (rule) => (
        <Switch checked={rule.isActive} />
      ),
    },
    {
      key: 'actions',
      header: t('rules.table.actions'),
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
          <h1 className="text-3xl font-bold tracking-tight">{t('rules.title')}</h1>
          <p className="text-muted-foreground">
            {t('rules.subtitle', {
              count: filteredRules.length,
              plural: filteredRules.length > 1 ? 's' : ''
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {t('rules.import')}
          </Button>
          <Button asChild>
            <Link href="/config/rules/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('rules.create')}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {t('rules.tabs.all', { count: mockValidationRules.length })}
          </TabsTrigger>
          <TabsTrigger value="document">
            {t('rules.tabs.document', { count: mockValidationRules.filter(r => r.type === 'document').length })}
          </TabsTrigger>
          <TabsTrigger value="cross_document">
            {t('rules.tabs.crossDocument', { count: mockValidationRules.filter(r => r.type === 'cross_document').length })}
          </TabsTrigger>
          <TabsTrigger value="global">
            {t('rules.tabs.global', { count: mockValidationRules.filter(r => r.type === 'global').length })}
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