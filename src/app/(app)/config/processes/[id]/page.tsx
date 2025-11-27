'use client';

import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockProcesses } from '@/lib/mock-data/processes';
import { mockDocumentTypes } from '@/lib/mock-data/document-types';
import { mockValidationRules } from '@/lib/mock-data/validation-rules';
import { ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Settings, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type RequiredDocument = {
  id: string;
  documentTypeId: string;
  documentType: string;
  required: boolean;
  condition: string;
  minCount: number;
  maxCount: number;
};

type ProcessRule = {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleCode: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
};

type PageProps = {
  params: { id: string };
};

export default function ProcessConfigPage({ params }: PageProps) {
  const { id } = params;
  const isNew = id === 'new';
  const process = isNew ? null : mockProcesses.find(p => p.id === id);

  if (!isNew && !process) {
    notFound();
  }

  const [formData, setFormData] = useState({
    code: process?.code || '',
    name: process?.name || '',
    category: process?.category || 'cee_residential',
    description: process?.description || '',
    version: process?.version || '1.0',
    isActive: process?.isActive ?? false,
    isCoupDePouce: process?.isCoupDePouce ?? false,
    validFrom: process?.validFrom ? new Date(process.validFrom).toISOString().split('T')[0] : '',
  });

  // Transform existing required documents to our type
  const initialDocs: RequiredDocument[] = (process?.requiredDocuments || []).map((doc: any, idx: number) => ({
    id: `doc-${idx}`,
    documentTypeId: doc.documentTypeId || '',
    documentType: doc.documentType || '',
    required: doc.required ?? true,
    condition: doc.condition || '',
    minCount: doc.minCount || 1,
    maxCount: doc.maxCount || 1,
  }));

  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>(initialDocs);
  const [processRules, setProcessRules] = useState<ProcessRule[]>([]);

  // Dialog states
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showAddRuleDialog, setShowAddRuleDialog] = useState(false);

  // Add document form state
  const [newDocument, setNewDocument] = useState({
    documentTypeId: '',
    required: true,
    condition: '',
    minCount: 1,
    maxCount: 1,
  });

  // Add rule form state
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  // Get already added document type IDs
  const addedDocTypeIds = requiredDocuments.map(d => d.documentTypeId);
  const availableDocTypes = mockDocumentTypes.filter(dt => !addedDocTypeIds.includes(dt.id));

  // Get already added rule IDs
  const addedRuleIds = processRules.map(r => r.ruleId);
  const availableRules = mockValidationRules.filter(r => !addedRuleIds.includes(r.id));

  const handleAddDocument = () => {
    const docType = mockDocumentTypes.find(dt => dt.id === newDocument.documentTypeId);
    if (!docType) return;

    const newDoc: RequiredDocument = {
      id: `doc-${Date.now()}`,
      documentTypeId: docType.id,
      documentType: docType.name,
      required: newDocument.required,
      condition: newDocument.condition,
      minCount: newDocument.minCount,
      maxCount: newDocument.maxCount,
    };

    setRequiredDocuments([...requiredDocuments, newDoc]);
    setNewDocument({ documentTypeId: '', required: true, condition: '', minCount: 1, maxCount: 1 });
    setShowAddDocumentDialog(false);
  };

  const handleRemoveDocument = (docId: string) => {
    setRequiredDocuments(requiredDocuments.filter(d => d.id !== docId));
  };

  const handleAddRules = () => {
    const newRules: ProcessRule[] = selectedRuleIds.map(ruleId => {
      const rule = mockValidationRules.find(r => r.id === ruleId)!;
      return {
        id: `prule-${Date.now()}-${ruleId}`,
        ruleId: rule.id,
        ruleName: rule.name,
        ruleCode: rule.code,
        severity: rule.severity,
        enabled: true,
      };
    });

    setProcessRules([...processRules, ...newRules]);
    setSelectedRuleIds([]);
    setShowAddRuleDialog(false);
  };

  const handleRemoveRule = (pruleId: string) => {
    setProcessRules(processRules.filter(r => r.id !== pruleId));
  };

  const handleToggleRule = (pruleId: string) => {
    setProcessRules(processRules.map(r => 
      r.id === pruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Avertissement</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link href="/config/processes" className="hover:text-foreground">Processus</Link>
        <span>/</span>
        <span className="text-foreground">{isNew ? 'Nouveau' : process?.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Créer un processus' : `Modifier ${process?.code}`}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? 'Configurer un nouveau processus CEE' : 'Modifier la configuration du processus'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/config/processes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Enregistrer brouillon
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Activer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Informations de base</TabsTrigger>
          <TabsTrigger value="documents">Documents requis</TabsTrigger>
          <TabsTrigger value="rules">Règles de validation</TabsTrigger>
          <TabsTrigger value="settings">Paramètres spécifiques</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>
                Définir les informations principales du processus
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
                    placeholder="BAR-TH-171"
                    disabled={!isNew}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: Lettres majuscules, chiffres et tirets uniquement
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pompe à chaleur air/eau"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cee_residential">CEE Résidentiel</SelectItem>
                      <SelectItem value="cee_tertiary">CEE Tertiaire</SelectItem>
                      <SelectItem value="cee_industrial">CEE Industriel</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valide à partir de</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du processus..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Coup de pouce</Label>
                  <p className="text-sm text-muted-foreground">
                    Marquer ce processus comme éligible au Coup de pouce
                  </p>
                </div>
                <Switch
                  checked={formData.isCoupDePouce}
                  onCheckedChange={(checked) => setFormData({ ...formData, isCoupDePouce: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Actif</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer ce processus pour la soumission de dossiers
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Required Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents requis</CardTitle>
                  <CardDescription>
                    Définir les types de documents nécessaires pour ce processus
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddDocumentDialog(true)} disabled={availableDocTypes.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requiredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun document requis.</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter un document" pour commencer.</p>
                  </div>
                ) : (
                  requiredDocuments.map((doc, index) => (
                    <div key={doc.id} className="flex items-center gap-3 p-4 border rounded-lg">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex-1 grid md:grid-cols-4 gap-4 items-center">
                        <div>
                          <Label className="text-xs text-muted-foreground">Type de document</Label>
                          <p className="font-medium">{doc.documentType}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Requis</Label>
                          <div className="mt-1">
                            <Badge variant={doc.required ? 'default' : 'secondary'}>
                              {doc.required ? 'Oui' : 'Optionnel'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Quantité</Label>
                          <p className="text-sm">
                            {doc.minCount === doc.maxCount ? doc.minCount : `${doc.minCount} - ${doc.maxCount}`}
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {availableDocTypes.length > 0 && requiredDocuments.length > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Types de documents disponibles à ajouter</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableDocTypes.map((docType) => (
                      <Badge 
                        key={docType.id} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          setNewDocument({ ...newDocument, documentTypeId: docType.id });
                          setShowAddDocumentDialog(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {docType.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Règles de validation inter-documents</CardTitle>
                  <CardDescription>
                    Sélectionner les règles de validation à appliquer pour ce processus
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddRuleDialog(true)} disabled={availableRules.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une règle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune règle configurée.</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter une règle" pour sélectionner des règles existantes.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setShowAddRuleDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Parcourir les règles disponibles
                    </Button>
                  </div>
                ) : (
                  processRules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-3 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(rule.severity)}
                      </div>
                      <div className="flex-1 grid md:grid-cols-4 gap-4 items-center">
                        <div>
                          <Label className="text-xs text-muted-foreground">Règle</Label>
                          <p className="font-medium">{rule.ruleName}</p>
                          <p className="text-xs text-muted-foreground">{rule.ruleCode}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Sévérité</Label>
                          <div className="mt-1">
                            {getSeverityBadge(rule.severity)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Statut</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Switch 
                              checked={rule.enabled} 
                              onCheckedChange={() => handleToggleRule(rule.id)}
                            />
                            <span className="text-sm">{rule.enabled ? 'Activée' : 'Désactivée'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/config/rules/${rule.ruleId}`}>
                              <Settings className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {processRules.length > 0 && availableRules.length > 0 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={() => setShowAddRuleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter d'autres règles ({availableRules.length} disponibles)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres spécifiques au processus</CardTitle>
              <CardDescription>
                Configuration avancée pour ce type de processus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kwhFormula">Formule de calcul kWh Cumac</Label>
                <Textarea
                  id="kwhFormula"
                  placeholder="surface * coefficient * climate_zone_factor"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Zones climatiques</Label>
                <div className="flex gap-2">
                  <Badge variant="outline">H1</Badge>
                  <Badge variant="outline">H2</Badge>
                  <Badge variant="outline">H3</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications RGE requises</Label>
                <Input
                  id="certifications"
                  placeholder="QualiPAC, QualiSol..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoApprove">Seuil d'approbation automatique (%)</Label>
                <Input
                  id="autoApprove"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="90"
                />
                <p className="text-xs text-muted-foreground">
                  Les dossiers avec un score de confiance supérieur seront approuvés automatiquement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Document Dialog */}
      <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un document requis</DialogTitle>
            <DialogDescription>
              Sélectionner un type de document et configurer ses exigences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docType">Type de document *</Label>
              <Select
                value={newDocument.documentTypeId}
                onValueChange={(value) => setNewDocument({ ...newDocument, documentTypeId: value })}
              >
                <SelectTrigger id="docType">
                  <SelectValue placeholder="Sélectionner un type de document" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocTypes.map((docType) => (
                    <SelectItem key={docType.id} value={docType.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{docType.name}</span>
                        <span className="text-xs text-muted-foreground">({docType.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Document requis</Label>
                <p className="text-xs text-muted-foreground">Ce document est obligatoire pour le dossier</p>
              </div>
              <Switch
                checked={newDocument.required}
                onCheckedChange={(checked) => setNewDocument({ ...newDocument, required: checked })}
              />
            </div>

            {!newDocument.required && (
              <div className="space-y-2">
                <Label htmlFor="condition">Condition (optionnel)</Label>
                <Input
                  id="condition"
                  placeholder="ex: beneficiary.precarite !== 'CLASSIQUE'"
                  value={newDocument.condition}
                  onChange={(e) => setNewDocument({ ...newDocument, condition: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Condition pour laquelle ce document devient requis
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minCount">Quantité minimum</Label>
                <Input
                  id="minCount"
                  type="number"
                  min="1"
                  max="10"
                  value={newDocument.minCount}
                  onChange={(e) => setNewDocument({ ...newDocument, minCount: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCount">Quantité maximum</Label>
                <Input
                  id="maxCount"
                  type="number"
                  min="1"
                  max="10"
                  value={newDocument.maxCount}
                  onChange={(e) => setNewDocument({ ...newDocument, maxCount: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDocumentDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddDocument} disabled={!newDocument.documentTypeId}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rule Dialog */}
      <Dialog open={showAddRuleDialog} onOpenChange={setShowAddRuleDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajouter des règles de validation</DialogTitle>
            <DialogDescription>
              Sélectionner les règles à appliquer pour ce processus
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {availableRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Toutes les règles ont déjà été ajoutées.</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/config/rules/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une nouvelle règle
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {availableRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRuleIds.includes(rule.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      if (selectedRuleIds.includes(rule.id)) {
                        setSelectedRuleIds(selectedRuleIds.filter(id => id !== rule.id));
                      } else {
                        setSelectedRuleIds([...selectedRuleIds, rule.id]);
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedRuleIds.includes(rule.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRuleIds([...selectedRuleIds, rule.id]);
                        } else {
                          setSelectedRuleIds(selectedRuleIds.filter(id => id !== rule.id));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(rule.severity)}
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant="outline" className="text-xs">{rule.code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getSeverityBadge(rule.severity)}
                        <Badge variant="secondary" className="text-xs">
                          {rule.type === 'cross_document' ? 'Inter-documents' : 
                           rule.type === 'document' ? 'Document' : 'Global'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-muted-foreground">
                {selectedRuleIds.length} règle(s) sélectionnée(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setSelectedRuleIds([]);
                  setShowAddRuleDialog(false);
                }}>
                  Annuler
                </Button>
                <Button onClick={handleAddRules} disabled={selectedRuleIds.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter {selectedRuleIds.length > 0 && `(${selectedRuleIds.length})`}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}