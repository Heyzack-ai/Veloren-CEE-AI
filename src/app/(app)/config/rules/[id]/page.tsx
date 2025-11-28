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

type PageProps = {
  params: { id: string };
};

export default function RuleBuilderPage({ params }: PageProps) {
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

  const [selectedProcessId, setSelectedProcessId] = useState<string>(
    rule?.appliesTo.processes?.[0] || 'all'
  );

  const [builderMode, setBuilderMode] = useState<'visual' | 'expression'>('visual');

  const [conditions, setConditions] = useState([
    { field: '', operator: 'equals', value: '', valueType: 'static' as 'static' | 'field' }
  ]);

  const [expandedDocTypes, setExpandedDocTypes] = useState<Set<string>>(new Set());

  // Get document types available for the selected process
  const availableDocumentTypes = useMemo(() => {
    if (selectedProcessId === 'all') {
      return mockDocumentTypes;
    }
    const process = mockProcesses.find(p => p.id === selectedProcessId);
    if (!process) return mockDocumentTypes;
    
    const processDocTypeNames = process.requiredDocuments.map(d => d.documentType);
    return mockDocumentTypes.filter(dt => 
      processDocTypeNames.includes(dt.name) || processDocTypeNames.includes(dt.code)
    );
  }, [selectedProcessId]);

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
        <Link href="/dashboard" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link href="/config/rules" className="hover:text-foreground">Règles</Link>
        <span>/</span>
        <span className="text-foreground">{isNew ? 'Nouvelle' : rule?.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Créer une règle de validation' : `Modifier ${rule?.code}`}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? 'Définir une nouvelle règle de validation' : 'Modifier la règle de validation'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/config/rules">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <Button variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Tester la règle
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer et activer
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de la règle</CardTitle>
              <CardDescription>
                Définir les informations de base de la règle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PRIME_CONSISTENCY"
                    disabled={!isNew}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Cohérence Prime CEE"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrire ce que vérifie cette règle..."
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de règle *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Règle document</SelectItem>
                      <SelectItem value="cross_document">Règle inter-documents</SelectItem>
                      <SelectItem value="global">Règle globale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Sévérité *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Erreur</SelectItem>
                      <SelectItem value="warning">Avertissement</SelectItem>
                      <SelectItem value="info">Information</SelectItem>
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
                      Rejet auto
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portée de la règle</CardTitle>
              <CardDescription>
                Définir à quels processus et documents cette règle s'applique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="processes">S'applique au processus</Label>
                <Select 
                  value={selectedProcessId} 
                  onValueChange={(value) => {
                    setSelectedProcessId(value);
                    // Reset document types when process changes
                    setSelectedDocTypes([]);
                  }}
                >
                  <SelectTrigger id="processes">
                    <SelectValue placeholder="Sélectionner un processus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les processus</SelectItem>
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
                    {mockProcesses.find(p => p.id === selectedProcessId)?.requiredDocuments.length || 0} types de documents disponibles pour ce processus
                  </p>
                )}
              </div>

              {formData.type !== 'global' && (
                <div className="space-y-2">
                  <Label>Types de documents</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Sélectionnez les types de documents concernés par cette règle
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
                          <span className="ml-1 text-xs">({docType.fieldSchema.length} champs)</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {selectedDocTypes.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠ Sélectionnez au moins un type de document pour accéder aux champs disponibles
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
                  <CardTitle>Constructeur de condition</CardTitle>
                  <CardDescription>
                    Définir la logique de validation
                  </CardDescription>
                </div>
                <Tabs value={builderMode} onValueChange={(v: any) => setBuilderMode(v)}>
                  <TabsList>
                    <TabsTrigger value="visual">Visuel</TabsTrigger>
                    <TabsTrigger value="expression">Expression</TabsTrigger>
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
                      <p className="text-sm">Sélectionnez des types de documents pour accéder aux champs</p>
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
                            <SelectValue placeholder="Champ source" />
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
                            <SelectValue placeholder="Opérateur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">égal à</SelectItem>
                            <SelectItem value="not_equals">différent de</SelectItem>
                            <SelectItem value="greater_than">supérieur à</SelectItem>
                            <SelectItem value="less_than">inférieur à</SelectItem>
                            <SelectItem value="greater_or_equal">supérieur ou égal à</SelectItem>
                            <SelectItem value="less_or_equal">inférieur ou égal à</SelectItem>
                            <SelectItem value="contains">contient</SelectItem>
                            <SelectItem value="starts_with">commence par</SelectItem>
                            <SelectItem value="ends_with">se termine par</SelectItem>
                            <SelectItem value="is_empty">est vide</SelectItem>
                            <SelectItem value="is_not_empty">n'est pas vide</SelectItem>
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
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">Valeur fixe</SelectItem>
                            <SelectItem value="field">Autre champ</SelectItem>
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
                              <SelectValue placeholder="Champ cible" />
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
                            placeholder="Valeur" 
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
                    Ajouter une condition
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
                    Utiliser la syntaxe JavaScript pour définir la condition
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message d'erreur</CardTitle>
              <CardDescription>
                Message affiché lorsque la règle échoue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.errorMessage}
                onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                placeholder="Le montant de la prime CEE diffère entre les documents..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Utiliser {'{field_name}'} pour insérer des valeurs dynamiques
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Règle active</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Rejet automatique</Label>
                <Switch
                  checked={formData.autoReject}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoReject: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isNew && rule && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Évaluations</p>
                    <p className="text-2xl font-bold">{rule.timesEvaluated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de réussite</p>
                    <p className="text-2xl font-bold text-green-600">
                      {((rule.passedCount / rule.timesEvaluated) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contournements</p>
                    <p className="text-2xl font-bold text-orange-600">{rule.overrideCount}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Champs disponibles</CardTitle>
              <CardDescription>
                Cliquez pour copier le chemin du champ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDocTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sélectionnez des types de documents pour voir les champs disponibles
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
                                title={`Cliquer pour copier: ${f.fullPath}`}
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