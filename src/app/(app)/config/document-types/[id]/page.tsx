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
import {
  mockDocumentTypes,
  DocumentType,
  FieldSchema,
  FieldDataType,
  DocumentTypeCategory,
} from '@/lib/mock-data/document-types';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Copy,
  FileText,
  Hash,
  Calendar,
  DollarSign,
  ToggleLeft,
  Mail,
  Phone,
  MapPin,
  List,
  PenTool,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { id: string };
};

const dataTypeIcons: Record<FieldDataType, React.ReactNode> = {
  string: <FileText className="h-4 w-4" />,
  integer: <Hash className="h-4 w-4" />,
  decimal: <Hash className="h-4 w-4" />,
  currency: <DollarSign className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  address: <MapPin className="h-4 w-4" />,
  enum: <List className="h-4 w-4" />,
  signature: <PenTool className="h-4 w-4" />,
};

const dataTypeLabels: Record<FieldDataType, string> = {
  string: 'Texte',
  integer: 'Entier',
  decimal: 'Décimal',
  currency: 'Monétaire',
  date: 'Date',
  boolean: 'Booléen',
  email: 'Email',
  phone: 'Téléphone',
  address: 'Adresse',
  enum: 'Liste de valeurs',
  signature: 'Signature',
};

const categoryLabels: Record<DocumentTypeCategory, string> = {
  commercial: 'Commercial',
  legal: 'Légal',
  administrative: 'Administratif',
  technical: 'Technique',
  photos: 'Photos',
};

const defaultFieldSchema: Omit<FieldSchema, 'id'> = {
  internalName: '',
  displayName: '',
  dataType: 'string',
  required: true,
  extractionHints: [],
  postProcessing: {},
  confidenceThreshold: 85,
};

export default function DocumentTypeConfigPage({ params }: PageProps) {
  const { id } = params;
  const isNew = id === 'new';
  const existingDocType = isNew ? null : mockDocumentTypes.find((dt) => dt.id === id);

  if (!isNew && !existingDocType) {
    notFound();
  }

  // Form state
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    category: DocumentTypeCategory;
    description: string;
    isSystem: boolean;
    isActive: boolean;
    classificationHints: string[];
    expectedPageRange: { min: number; max: number };
  }>({
    code: existingDocType?.code || '',
    name: existingDocType?.name || '',
    category: existingDocType?.category || 'commercial',
    description: existingDocType?.description || '',
    isSystem: existingDocType?.isSystem ?? false,
    isActive: existingDocType?.isActive ?? true,
    classificationHints: existingDocType?.classificationHints || [],
    expectedPageRange: existingDocType?.expectedPageRange || { min: 1, max: 5 },
  });

  const [fieldSchema, setFieldSchema] = useState<FieldSchema[]>(
    existingDocType?.fieldSchema || []
  );

  // Dialog states
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<FieldSchema | null>(null);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  // New field form state
  const [newField, setNewField] = useState<Omit<FieldSchema, 'id'>>(defaultFieldSchema);
  const [hintsInput, setHintsInput] = useState('');
  const [classificationHintsInput, setClassificationHintsInput] = useState(
    existingDocType?.classificationHints.join(', ') || ''
  );

  const handleAddField = () => {
    const field: FieldSchema = {
      ...newField,
      id: `f-${Date.now()}`,
      extractionHints: hintsInput
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean),
    };

    if (editingField) {
      setFieldSchema(fieldSchema.map((f) => (f.id === editingField.id ? { ...field, id: editingField.id } : f)));
    } else {
      setFieldSchema([...fieldSchema, field]);
    }

    setNewField(defaultFieldSchema);
    setHintsInput('');
    setEditingField(null);
    setShowAddFieldDialog(false);
  };

  const handleEditField = (field: FieldSchema) => {
    setEditingField(field);
    setNewField({
      internalName: field.internalName,
      displayName: field.displayName,
      dataType: field.dataType,
      required: field.required,
      extractionHints: field.extractionHints,
      postProcessing: field.postProcessing,
      confidenceThreshold: field.confidenceThreshold,
      fieldGroup: field.fieldGroup,
      crossReferenceFields: field.crossReferenceFields,
      maxLength: field.maxLength,
      validationRegex: field.validationRegex,
      minValue: field.minValue,
      maxValue: field.maxValue,
      enumValues: field.enumValues,
    });
    setHintsInput(field.extractionHints.join(', '));
    setShowAddFieldDialog(true);
  };

  const handleRemoveField = (fieldId: string) => {
    setFieldSchema(fieldSchema.filter((f) => f.id !== fieldId));
  };

  const handleDuplicateField = (field: FieldSchema) => {
    const duplicated: FieldSchema = {
      ...field,
      id: `f-${Date.now()}`,
      internalName: `${field.internalName}_copy`,
      displayName: `${field.displayName} (copie)`,
    };
    setFieldSchema([...fieldSchema, duplicated]);
  };

  const toggleFieldExpanded = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fieldSchema];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFieldSchema(newFields);
  };

  // Group fields by fieldGroup
  const groupedFields = fieldSchema.reduce(
    (acc, field) => {
      const group = field.fieldGroup || 'Autres';
      if (!acc[group]) acc[group] = [];
      acc[group].push(field);
      return acc;
    },
    {} as Record<string, FieldSchema[]>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/config" className="hover:text-foreground">
          Configuration
        </Link>
        <span>/</span>
        <Link href="/config/document-types" className="hover:text-foreground">
          Types de documents
        </Link>
        <span>/</span>
        <span className="text-foreground">{isNew ? 'Nouveau' : existingDocType?.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Créer un type de document' : `Modifier ${existingDocType?.code}`}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? 'Définir un nouveau type de document et ses champs'
              : 'Modifier la configuration du type de document'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/config/document-types">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Informations de base</TabsTrigger>
          <TabsTrigger value="fields">
            Schéma des champs
            <Badge variant="secondary" className="ml-2">
              {fieldSchema.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="extraction">Paramètres d'extraction</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>
                Définir les informations principales du type de document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="DEVIS"
                    disabled={!isNew && existingDocType?.isSystem}
                  />
                  <p className="text-xs text-muted-foreground">
                    Identifiant unique du type de document
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Devis"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: DocumentTypeCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pages attendues</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.expectedPageRange.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedPageRange: {
                            ...formData.expectedPageRange,
                            min: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                      className="w-20"
                    />
                    <span className="text-muted-foreground">à</span>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.expectedPageRange.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedPageRange: {
                            ...formData.expectedPageRange,
                            max: parseInt(e.target.value) || 5,
                          },
                        })
                      }
                      className="w-20"
                    />
                    <span className="text-muted-foreground">pages</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du type de document..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classificationHints">Indices de classification</Label>
                <Input
                  id="classificationHints"
                  value={classificationHintsInput}
                  onChange={(e) => setClassificationHintsInput(e.target.value)}
                  placeholder="devis, quote, proposition, estimation"
                />
                <p className="text-xs text-muted-foreground">
                  Mots-clés séparés par des virgules pour aider à classifier ce type de document
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Actif</Label>
                  <p className="text-sm text-muted-foreground">
                    Ce type de document peut être utilisé dans les processus
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

        {/* Field Schema Tab */}
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Schéma des champs</CardTitle>
                  <CardDescription>
                    Définir les champs à extraire de ce type de document
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddFieldDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un champ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fieldSchema.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Aucun champ défini</p>
                  <p className="text-sm mt-1">
                    Cliquez sur "Ajouter un champ" pour commencer à définir le schéma
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddFieldDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le premier champ
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedFields).map(([groupName, fields]) => (
                    <div key={groupName}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">
                        {groupName}
                      </h4>
                      <div className="space-y-2">
                        {fields.map((field, index) => {
                          const globalIndex = fieldSchema.findIndex((f) => f.id === field.id);
                          const isExpanded = expandedFields.has(field.id);

                          return (
                            <div
                              key={field.id}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleFieldExpanded(field.id)}
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                                <div className="flex items-center gap-2">
                                  {dataTypeIcons[field.dataType]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{field.displayName}</span>
                                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {field.internalName}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {dataTypeLabels[field.dataType]}
                                    </Badge>
                                    {field.required && (
                                      <Badge variant="secondary" className="text-xs">
                                        Requis
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      Confiance: {field.confidenceThreshold}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveField(globalIndex, 'up');
                                    }}
                                    disabled={globalIndex === 0}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveField(globalIndex, 'down');
                                    }}
                                    disabled={globalIndex === fieldSchema.length - 1}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditField(field);
                                    }}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateField(field);
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveField(field.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Indices d'extraction
                                      </Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {field.extractionHints.map((hint, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {hint}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">
                                        Post-traitement
                                      </Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {field.postProcessing.uppercase && (
                                          <Badge variant="outline" className="text-xs">
                                            Majuscules
                                          </Badge>
                                        )}
                                        {field.postProcessing.lowercase && (
                                          <Badge variant="outline" className="text-xs">
                                            Minuscules
                                          </Badge>
                                        )}
                                        {field.postProcessing.trimWhitespace && (
                                          <Badge variant="outline" className="text-xs">
                                            Trim
                                          </Badge>
                                        )}
                                        {field.postProcessing.removeSpecialChars && (
                                          <Badge variant="outline" className="text-xs">
                                            Sans caractères spéciaux
                                          </Badge>
                                        )}
                                        {!Object.values(field.postProcessing).some(Boolean) && (
                                          <span className="text-xs text-muted-foreground">
                                            Aucun
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {field.crossReferenceFields &&
                                      field.crossReferenceFields.length > 0 && (
                                        <div className="md:col-span-2">
                                          <Label className="text-xs text-muted-foreground">
                                            Champs de référence croisée
                                          </Label>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {field.crossReferenceFields.map((ref, i) => (
                                              <Badge key={i} variant="secondary" className="text-xs">
                                                {ref}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extraction Settings Tab */}
        <TabsContent value="extraction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'extraction</CardTitle>
              <CardDescription>
                Configuration avancée pour l'extraction des données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultConfidence">Seuil de confiance par défaut (%)</Label>
                <Input
                  id="defaultConfidence"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="85"
                />
                <p className="text-xs text-muted-foreground">
                  Seuil minimum de confiance pour valider une extraction
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Validation OCR stricte</Label>
                  <p className="text-sm text-muted-foreground">
                    Rejeter les extractions avec une qualité OCR insuffisante
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Extraction multi-pages</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre l'extraction de champs répartis sur plusieurs pages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Field Dialog */}
      <Dialog
        open={showAddFieldDialog}
        onOpenChange={(open) => {
          setShowAddFieldDialog(open);
          if (!open) {
            setEditingField(null);
            setNewField(defaultFieldSchema);
            setHintsInput('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Modifier le champ' : 'Ajouter un nouveau champ'}
            </DialogTitle>
            <DialogDescription>
              Définir les propriétés du champ à extraire
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="internalName">Nom interne *</Label>
                <Input
                  id="internalName"
                  value={newField.internalName}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      internalName: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                  placeholder="prime_cee"
                />
                <p className="text-xs text-muted-foreground">
                  Utilisé dans les règles et expressions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nom affiché *</Label>
                <Input
                  id="displayName"
                  value={newField.displayName}
                  onChange={(e) => setNewField({ ...newField, displayName: e.target.value })}
                  placeholder="Prime CEE"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataType">Type de données *</Label>
                <Select
                  value={newField.dataType}
                  onValueChange={(value: FieldDataType) =>
                    setNewField({ ...newField, dataType: value })
                  }
                >
                  <SelectTrigger id="dataType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dataTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          {dataTypeIcons[value as FieldDataType]}
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldGroup">Groupe</Label>
                <Input
                  id="fieldGroup"
                  value={newField.fieldGroup || ''}
                  onChange={(e) => setNewField({ ...newField, fieldGroup: e.target.value })}
                  placeholder="Identification, Financial, Technical..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extractionHints">Indices d'extraction</Label>
              <Input
                id="extractionHints"
                value={hintsInput}
                onChange={(e) => setHintsInput(e.target.value)}
                placeholder="prime, cee, montant, énergie"
              />
              <p className="text-xs text-muted-foreground">
                Mots-clés séparés par des virgules pour aider à localiser ce champ
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">Seuil de confiance (%)</Label>
                <Input
                  id="confidenceThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={newField.confidenceThreshold}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      confidenceThreshold: parseInt(e.target.value) || 85,
                    })
                  }
                />
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2 h-10">
                  <Checkbox
                    id="required"
                    checked={newField.required}
                    onCheckedChange={(checked) =>
                      setNewField({ ...newField, required: checked as boolean })
                    }
                  />
                  <Label htmlFor="required">Champ requis</Label>
                </div>
              </div>
            </div>

            {/* Conditional fields based on data type */}
            {newField.dataType === 'string' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLength">Longueur max</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    min="1"
                    value={newField.maxLength || ''}
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        maxLength: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validationRegex">Regex de validation</Label>
                  <Input
                    id="validationRegex"
                    value={newField.validationRegex || ''}
                    onChange={(e) =>
                      setNewField({ ...newField, validationRegex: e.target.value || undefined })
                    }
                    placeholder="^[A-Z0-9-]+$"
                  />
                </div>
              </div>
            )}

            {(newField.dataType === 'integer' ||
              newField.dataType === 'decimal' ||
              newField.dataType === 'currency') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minValue">Valeur minimum</Label>
                  <Input
                    id="minValue"
                    type="number"
                    value={newField.minValue ?? ''}
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        minValue: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">Valeur maximum</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    value={newField.maxValue ?? ''}
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        maxValue: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="100000"
                  />
                </div>
              </div>
            )}

            {newField.dataType === 'enum' && (
              <div className="space-y-2">
                <Label htmlFor="enumValues">Valeurs possibles</Label>
                <Textarea
                  id="enumValues"
                  value={newField.enumValues?.join('\n') || ''}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      enumValues: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Une valeur par ligne</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Post-traitement</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uppercase"
                    checked={newField.postProcessing.uppercase}
                    onCheckedChange={(checked) =>
                      setNewField({
                        ...newField,
                        postProcessing: {
                          ...newField.postProcessing,
                          uppercase: checked as boolean,
                          lowercase: checked ? false : newField.postProcessing.lowercase,
                        },
                      })
                    }
                  />
                  <Label htmlFor="uppercase" className="text-sm">
                    Majuscules
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowercase"
                    checked={newField.postProcessing.lowercase}
                    onCheckedChange={(checked) =>
                      setNewField({
                        ...newField,
                        postProcessing: {
                          ...newField.postProcessing,
                          lowercase: checked as boolean,
                          uppercase: checked ? false : newField.postProcessing.uppercase,
                        },
                      })
                    }
                  />
                  <Label htmlFor="lowercase" className="text-sm">
                    Minuscules
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trimWhitespace"
                    checked={newField.postProcessing.trimWhitespace}
                    onCheckedChange={(checked) =>
                      setNewField({
                        ...newField,
                        postProcessing: {
                          ...newField.postProcessing,
                          trimWhitespace: checked as boolean,
                        },
                      })
                    }
                  />
                  <Label htmlFor="trimWhitespace" className="text-sm">
                    Supprimer espaces
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="removeSpecialChars"
                    checked={newField.postProcessing.removeSpecialChars}
                    onCheckedChange={(checked) =>
                      setNewField({
                        ...newField,
                        postProcessing: {
                          ...newField.postProcessing,
                          removeSpecialChars: checked as boolean,
                        },
                      })
                    }
                  />
                  <Label htmlFor="removeSpecialChars" className="text-sm">
                    Sans caractères spéciaux
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crossReference">Champs de référence croisée</Label>
              <Input
                id="crossReference"
                value={newField.crossReferenceFields?.join(', ') || ''}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    crossReferenceFields: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="facture.prime_cee, cdc.prime_montant"
              />
              <p className="text-xs text-muted-foreground">
                Champs d'autres documents pour comparaison automatique
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFieldDialog(false);
                setEditingField(null);
                setNewField(defaultFieldSchema);
                setHintsInput('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddField}
              disabled={!newField.internalName || !newField.displayName}
            >
              {editingField ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
