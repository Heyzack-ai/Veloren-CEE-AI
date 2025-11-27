'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockValidationRules } from '@/lib/mock-data/validation-rules';
import { mockDocumentTypes } from '@/lib/mock-data/document-types';
import { ArrowLeft, Save, Play, Plus, Trash2 } from 'lucide-react';
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

  const [builderMode, setBuilderMode] = useState<'visual' | 'expression'>('visual');

  const [conditions, setConditions] = useState([
    { field: '', operator: 'equals', value: '' }
  ]);

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
                Définir à quels documents cette règle s'applique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.type !== 'global' && (
                <div className="space-y-2">
                  <Label>Types de documents</Label>
                  <div className="flex flex-wrap gap-2">
                    {mockDocumentTypes.map((docType) => (
                      <Badge
                        key={docType.id}
                        variant={selectedDocTypes.includes(docType.code) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedDocTypes(prev =>
                            prev.includes(docType.code)
                              ? prev.filter(c => c !== docType.code)
                              : [...prev, docType.code]
                          );
                        }}
                      >
                        {docType.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="processes">S'applique aux processus</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="processes">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les processus</SelectItem>
                    <SelectItem value="specific">Processus spécifiques...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  {conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 grid md:grid-cols-3 gap-2">
                        <Select value={condition.field}>
                          <SelectTrigger>
                            <SelectValue placeholder="Champ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="devis.prime_cee">devis.prime_cee</SelectItem>
                            <SelectItem value="facture.prime_cee">facture.prime_cee</SelectItem>
                            <SelectItem value="cdc.prime_montant">cdc.prime_montant</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={condition.operator}>
                          <SelectTrigger>
                            <SelectValue placeholder="Opérateur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">égal à</SelectItem>
                            <SelectItem value="not_equals">différent de</SelectItem>
                            <SelectItem value="greater_than">supérieur à</SelectItem>
                            <SelectItem value="less_than">inférieur à</SelectItem>
                            <SelectItem value="contains">contient</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input placeholder="Valeur" value={condition.value} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConditions([...conditions, { field: '', operator: 'equals', value: '' }])}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {selectedDocTypes.map((docType) => (
                  <div key={docType}>
                    <p className="font-medium">{docType}</p>
                    <div className="pl-2 text-muted-foreground space-y-1">
                      <p>• {docType.toLowerCase()}.field_name</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}