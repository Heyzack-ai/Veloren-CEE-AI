'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockValidationRules } from '@/lib/mock-data/validation-rules';
import { mockDocumentTypes, FieldSchema } from '@/lib/mock-data/document-types';
import { mockProcesses } from '@/lib/mock-data/processes';
import { ArrowLeft, Save, Play, Plus, Trash2, FileText, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

type PageProps = {
  params: { id: string };
};

export default function RuleBuilderPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { id } = params;
  const isNew = id === 'new';
  const rule = isNew ? null : mockValidationRules.find(r => r.id === id);

  if (!isNew && !rule) {
    notFound();
  }

  const [formData, setFormData] = useState({
    code: rule?.code || '',
    name: rule?.name || '',
    description: rule?.description || '',
    type: rule?.type || 'document',
    severity: rule?.severity || 'error',
    isActive: rule?.isActive ?? true,
    autoReject: rule?.autoReject ?? false,
    condition: rule?.condition || '',
    errorMessage: rule?.errorMessage || '',
  });

  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>(
    rule?.appliesTo.documentTypes || []
  );

  // Multi-select for process types
  const [selectedProcessTypes, setSelectedProcessTypes] = useState<string[]>(
    rule?.appliesTo.processTypes || []
  );

  // Filter/scope for process selection (single select)
  const [selectedProcessId, setSelectedProcessId] = useState<string>('all');

  const [builderMode, setBuilderMode] = useState<'visual' | 'expression'>('visual');

  const [conditions, setConditions] = useState([
    { field: '', operator: 'equals', value: '', valueType: 'static' as 'static' | 'field' }
  ]);

  const [expandedDocTypes, setExpandedDocTypes] = useState<Set<string>>(new Set());

  // Get document types available based on selected processes
  const availableDocumentTypes = useMemo(() => {
    // If no processes selected, show all document types
    if (selectedProcessTypes.length === 0) {
      return mockDocumentTypes;
    }

    // Get all document types from selected processes
    const selectedProcesses = mockProcesses.filter(p => selectedProcessTypes.includes(p.id));
    const allDocTypeNames = new Set<string>();

    selectedProcesses.forEach(process => {
      process.requiredDocuments.forEach(d => {
        allDocTypeNames.add(d.documentType);
      });
    });

    return mockDocumentTypes.filter(dt =>
      allDocTypeNames.has(dt.name) || allDocTypeNames.has(dt.code)
    );
  }, [selectedProcessTypes]);

  // Get all fields from selected document types
  const availableFields = useMemo(() => {
    const fields: Array<{ docType: string; docCode: string; field: FieldSchema; fullPath: string }> = [];
    
    selectedDocTypes.forEach(docTypeCode => {
      const docType = mockDocumentTypes.find(dt => dt.code === docTypeCode);
      if (docType && docType.fieldSchema) {
        docType.fieldSchema.forEach(field => {
          fields.push({
            docType: docType.name,
            docCode: docType.code.toLowerCase(),
            field,
            fullPath: `${docType.code.toLowerCase()}.${field.internalName}`
          });
        });
      }
    });
    
    return fields;
  }, [selectedDocTypes]);

  // Group available fields by document type
  const fieldsByDocType = useMemo(() => {
    const grouped: Record<string, typeof availableFields> = {};
    availableFields.forEach(f => {
      if (!grouped[f.docType]) grouped[f.docType] = [];
      grouped[f.docType].push(f);
    });
    return grouped;
  }, [availableFields]);

  const toggleDocTypeExpanded = (docType: string) => {
    const newExpanded = new Set(expandedDocTypes);
    if (newExpanded.has(docType)) {
      newExpanded.delete(docType);
    } else {
      newExpanded.add(docType);
    }
    setExpandedDocTypes(newExpanded);
  };

  const insertFieldPath = (fullPath: string) => {
    // Copy to clipboard for easy use
    navigator.clipboard.writeText(fullPath);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">{t('ruleWizard.breadcrumb.home')}</Link>
        <span>/</span>
        <Link href="/config/rules" className="hover:text-foreground">{t('ruleWizard.breadcrumb.rules')}</Link>
        <span>/</span>
        <span className="text-foreground">{isNew ? t('ruleWizard.breadcrumb.new') : rule?.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? t('ruleWizard.title.create') : t('ruleWizard.title.edit', { code: rule?.code })}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? t('ruleWizard.subtitle.create') : t('ruleWizard.subtitle.edit')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/config/rules">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('ruleWizard.button.back')}
            </Link>
          </Button>
          <Button variant="outline">
            <Play className="h-4 w-4 mr-2" />
            {t('ruleWizard.button.test')}
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            {t('ruleWizard.button.save')}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('ruleWizard.basic.title')}</CardTitle>
              <CardDescription>
                {t('ruleWizard.basic.cardDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('ruleWizard.basic.code')}</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PRIME_CONSISTENCY"
                    disabled={!isNew}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('ruleWizard.basic.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('ruleWizard.basic.namePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('ruleWizard.basic.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('ruleWizard.basic.descriptionPlaceholder')}
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t('ruleWizard.basic.type')}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">{t('ruleWizard.basic.typeDocument')}</SelectItem>
                      <SelectItem value="cross_document">{t('ruleWizard.basic.typeCrossDocument')}</SelectItem>
                      <SelectItem value="global">{t('ruleWizard.basic.typeGlobal')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">{t('ruleWizard.basic.severity')}</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">{t('ruleWizard.basic.severityError')}</SelectItem>
                      <SelectItem value="warning">{t('ruleWizard.basic.severityWarning')}</SelectItem>
                      <SelectItem value="info">{t('ruleWizard.basic.severityInfo')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoReject"
                      checked={formData.autoReject}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoReject: checked })}
                    />
                    <Label htmlFor="autoReject" className="text-sm">
                      {t('ruleWizard.basic.autoReject')}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('ruleWizard.scope.title')}</CardTitle>
              <CardDescription>
                {t('ruleWizard.scope.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Process Types Multi-Select */}
              <div className="space-y-2">
                <Label htmlFor="processes">{t('ruleWizard.scope.process')}</Label>
                <Select
                  value={selectedProcessId}
                  onValueChange={(value) => {
                    setSelectedProcessId(value);
                    // Reset document types when process changes
                    setSelectedDocTypes([]);
                  }}
                >
                  <SelectTrigger id="processes">
                    <SelectValue placeholder={t('ruleWizard.scope.processPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('ruleWizard.scope.allProcesses')}</SelectItem>
                    {mockProcesses.map((process) => (
                      <SelectItem key={process.id} value={process.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{process.code}</span>
                          <span className="text-muted-foreground">- {process.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProcessId !== 'all' && (
                  <p className="text-xs text-muted-foreground">
                    {t('ruleWizard.scope.documentTypesAvailable', { count: mockProcesses.find(p => p.id === selectedProcessId)?.requiredDocuments.length || 0 })}
                  </p>
                )}
                {selectedProcessTypes.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {t('ruleWizard.scope.selectedProcessCount', { count: selectedProcessTypes.length })}
                    </p>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setSelectedProcessTypes([])}
                    >
                      {t('ruleWizard.scope.clearSelection')}
                    </button>
                  </div>
                )}
              </div>

              {formData.type !== 'global' && (
                <div className="space-y-2">
                  <Label>{t('ruleWizard.scope.documentTypes')}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('ruleWizard.scope.documentTypesHint')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableDocumentTypes.map((docType) => (
                      <Badge
                        key={docType.id}
                        variant={selectedDocTypes.includes(docType.code) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedDocTypes(prev =>
                            prev.includes(docType.code)
                              ? prev.filter(c => c !== docType.code)
                              : [...prev, docType.code]
                          );
                        }}
                      >
                        {docType.name}
                        {selectedDocTypes.includes(docType.code) && (
                          <span className="ml-1 text-xs">{t('ruleWizard.scope.fieldsCount', { count: docType.fieldSchema.length })}</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {selectedDocTypes.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      {t('ruleWizard.scope.warning')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('ruleWizard.condition.title')}</CardTitle>
                  <CardDescription>
                    {t('ruleWizard.condition.description')}
                  </CardDescription>
                </div>
                <Tabs value={builderMode} onValueChange={(v: any) => setBuilderMode(v)}>
                  <TabsList>
                    <TabsTrigger value="visual">{t('ruleWizard.condition.tabVisual')}</TabsTrigger>
                    <TabsTrigger value="expression">{t('ruleWizard.condition.tabExpression')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {builderMode === 'visual' ? (
                <div className="space-y-3">
                  {availableFields.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/30">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('ruleWizard.condition.emptyState')}</p>
                    </div>
                  )}
                  {conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 grid md:grid-cols-4 gap-2">
                        <Select
                          value={condition.field}
                          onValueChange={(value) => {
                            const newConditions = [...conditions];
                            newConditions[index] = { ...newConditions[index], field: value };
                            setConditions(newConditions);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('ruleWizard.condition.sourceField')} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(fieldsByDocType).map(([docType, fields]) => (
                              <div key={docType}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                  {docType}
                                </div>
                                {fields.map((f) => (
                                  <SelectItem key={f.fullPath} value={f.fullPath}>
                                    {f.field.displayName}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value) => {
                            const newConditions = [...conditions];
                            newConditions[index] = { ...newConditions[index], operator: value };
                            setConditions(newConditions);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('ruleWizard.condition.operator')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">{t('ruleWizard.condition.operatorEquals')}</SelectItem>
                            <SelectItem value="not_equals">{t('ruleWizard.condition.operatorNotEquals')}</SelectItem>
                            <SelectItem value="greater_than">{t('ruleWizard.condition.operatorGreaterThan')}</SelectItem>
                            <SelectItem value="less_than">{t('ruleWizard.condition.operatorLessThan')}</SelectItem>
                            <SelectItem value="greater_or_equal">{t('ruleWizard.condition.operatorGreaterOrEqual')}</SelectItem>
                            <SelectItem value="less_or_equal">{t('ruleWizard.condition.operatorLessOrEqual')}</SelectItem>
                            <SelectItem value="contains">{t('ruleWizard.condition.operatorContains')}</SelectItem>
                            <SelectItem value="starts_with">{t('ruleWizard.condition.operatorStartsWith')}</SelectItem>
                            <SelectItem value="ends_with">{t('ruleWizard.condition.operatorEndsWith')}</SelectItem>
                            <SelectItem value="is_empty">{t('ruleWizard.condition.operatorIsEmpty')}</SelectItem>
                            <SelectItem value="is_not_empty">{t('ruleWizard.condition.operatorIsNotEmpty')}</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.valueType}
                          onValueChange={(value: 'static' | 'field') => {
                            const newConditions = [...conditions];
                            newConditions[index] = { ...newConditions[index], valueType: value, value: '' };
                            setConditions(newConditions);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('ruleWizard.condition.type')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">{t('ruleWizard.condition.typeStatic')}</SelectItem>
                            <SelectItem value="field">{t('ruleWizard.condition.typeField')}</SelectItem>
                          </SelectContent>
                        </Select>

                        {condition.valueType === 'field' ? (
                          <Select
                            value={condition.value}
                            onValueChange={(value) => {
                              const newConditions = [...conditions];
                              newConditions[index] = { ...newConditions[index], value };
                              setConditions(newConditions);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('ruleWizard.condition.targetField')} />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(fieldsByDocType).map(([docType, fields]) => (
                                <div key={docType}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                    {docType}
                                  </div>
                                  {fields.map((f) => (
                                    <SelectItem key={f.fullPath} value={f.fullPath}>
                                      {f.field.displayName}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={t('ruleWizard.condition.value')}
                            value={condition.value}
                            onChange={(e) => {
                              const newConditions = [...conditions];
                              newConditions[index] = { ...newConditions[index], value: e.target.value };
                              setConditions(newConditions);
                            }}
                          />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                        disabled={conditions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConditions([...conditions, { field: '', operator: 'equals', value: '', valueType: 'static' }])}
                    disabled={availableFields.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('ruleWizard.condition.addCondition')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    placeholder="devis.prime_cee === facture.prime_cee && facture.prime_cee === cdc.prime_montant"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('ruleWizard.condition.expressionHint')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('ruleWizard.error.title')}</CardTitle>
              <CardDescription>
                {t('ruleWizard.error.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.errorMessage}
                onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                placeholder={t('ruleWizard.error.placeholder')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t('ruleWizard.error.hint')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('ruleWizard.sidebar.statusTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('ruleWizard.sidebar.activeRule')}</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('ruleWizard.sidebar.autoReject')}</Label>
                <Switch
                  checked={formData.autoReject}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoReject: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('ruleWizard.sidebar.statisticsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isNew && rule && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('ruleWizard.sidebar.evaluations')}</p>
                    <p className="text-2xl font-bold">{rule.timesEvaluated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('ruleWizard.sidebar.successRate')}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {((rule.passedCount / rule.timesEvaluated) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('ruleWizard.sidebar.overrides')}</p>
                    <p className="text-2xl font-bold text-orange-600">{rule.overrideCount}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('ruleWizard.sidebar.fieldsTitle')}</CardTitle>
              <CardDescription>
                {t('ruleWizard.sidebar.fieldsHint')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDocTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('ruleWizard.sidebar.fieldsEmptyState')}
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(fieldsByDocType).map(([docType, fields]) => {
                    const isExpanded = expandedDocTypes.has(docType);
                    return (
                      <div key={docType} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                          onClick={() => toggleDocTypeExpanded(docType)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{docType}</span>
                            <Badge variant="secondary" className="text-xs">
                              {fields.length}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="border-t bg-muted/20">
                            {fields.map((f) => (
                              <div
                                key={f.fullPath}
                                className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 cursor-pointer group"
                                onClick={() => insertFieldPath(f.fullPath)}
                                title={t('ruleWizard.sidebar.clickToCopy', { path: f.fullPath })}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">
                                    {f.field.displayName}
                                  </p>
                                  <code className="text-xs text-muted-foreground">
                                    {f.fullPath}
                                  </code>
                                </div>
                                <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}