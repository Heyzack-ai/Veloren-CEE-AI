'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StatusBadge } from '@/components/status-badge';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { useAuth } from '@/lib/auth-context';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PageProps = {
  params: { id: string };
};

export default function DossierDetailPage({ params }: PageProps) {
  const { id } = params;
  const { user } = useAuth();
  const dossier = mockDossiers.find(d => d.id === id);

  if (!dossier) {
    notFound();
  }

  const isAdmin = user?.role === 'administrator';
  const isValidator = user?.role === 'validator';

  // Mock extracted data
  const extractedData = {
    identification: [
      { label: 'Numéro de devis', value: 'DEV-2024-1234', source: 'Devis', confidence: 98 },
      { label: 'Date de devis', value: '15/11/2024', source: 'Devis', confidence: 99 },
      { label: 'Numéro de facture', value: 'FACT-2024-5678', source: 'Facture', confidence: 97 },
      { label: 'Date de facture', value: '20/11/2024', source: 'Facture', confidence: 99 },
    ],
    financial: [
      { label: 'Prime CEE', value: '2 500 €', source: 'Devis', confidence: 95 },
      { label: 'Montant total TTC', value: '8 750 €', source: 'Facture', confidence: 98 },
      { label: 'Reste à payer', value: '0 €', source: 'Facture', confidence: 99 },
    ],
    technical: [
      { label: 'Marque équipement', value: 'Daikin', source: 'Devis', confidence: 92 },
      { label: 'Modèle', value: 'Altherma 3 H HT', source: 'Devis', confidence: 90 },
      { label: 'Puissance', value: '16 kW', source: 'Devis', confidence: 94 },
      { label: 'COP', value: '4.5', source: 'Devis', confidence: 88 },
      { label: 'Surface chauffée', value: '120 m²', source: 'AH', confidence: 96 },
      { label: 'Zone climatique', value: 'H1', source: 'AH', confidence: 99 },
    ],
  };

  // Mock validation results
  const validationResults = {
    passed: 12,
    warnings: 2,
    errors: 0,
    rules: [
      { name: 'Cohérence des montants', status: 'passed', message: '' },
      { name: 'Signatures présentes', status: 'warning', message: 'Signature bénéficiaire peu lisible' },
      { name: 'Dates cohérentes', status: 'passed', message: '' },
      { name: 'RGE valide', status: 'passed', message: '' },
      { name: 'Équipement éligible', status: 'warning', message: 'COP légèrement en dessous du seuil recommandé' },
    ],
  };

  // Mock activity timeline
  const activities = [
    { date: new Date(), user: 'Système', action: 'Dossier créé', type: 'info' },
    { date: new Date(Date.now() - 3600000), user: 'Système', action: 'Documents téléchargés', type: 'info' },
    { date: new Date(Date.now() - 7200000), user: 'IA', action: 'Traitement commencé', type: 'info' },
    { date: new Date(Date.now() - 10800000), user: 'IA', action: 'Extraction terminée', type: 'success' },
    { date: new Date(Date.now() - 14400000), user: 'Marie Validator', action: 'Assigné pour validation', type: 'info' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link href="/dossiers" className="hover:text-foreground">Dossiers</Link>
        <span>/</span>
        <span className="text-foreground">{dossier.reference}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold">{dossier.reference}</h1>
            <StatusBadge status={dossier.status} />
          </div>
          <p className="text-muted-foreground">
            {dossier.processName} • Soumis le {format(dossier.submittedAt, 'PPP', { locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          {(isAdmin || isValidator) && dossier.status === 'awaiting_review' && (
            <Button asChild>
              <Link href={`/validation/${dossier.id}`}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Valider
              </Link>
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="outline" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dossier Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du dossier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Référence</p>
                <p className="font-medium">{dossier.reference}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processus</p>
                <p className="font-medium">{dossier.processCode} - {dossier.processName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <StatusBadge status={dossier.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Installateur</p>
                <Link href={`/installers/${dossier.installerId}`} className="font-medium hover:underline">
                  {dossier.installerName}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Soumis le</p>
                <p className="font-medium">{format(dossier.submittedAt, 'PPPp', { locale: fr })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                <p className="font-medium">{format(dossier.updatedAt, 'PPPp', { locale: fr })}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Validateur assigné</p>
                <p className="font-medium">{dossier.assignedValidatorName || 'Non assigné'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priorité</p>
                <Badge variant={dossier.priority === 'high' ? 'destructive' : 'secondary'}>
                  {dossier.priority === 'high' ? 'Haute' : dossier.priority === 'normal' ? 'Normale' : 'Basse'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de confiance</p>
                <ConfidenceIndicator value={dossier.confidence} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps de traitement</p>
                <p className="font-medium">{dossier.processingTime} minutes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations bénéficiaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-medium">{dossier.beneficiary.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut de précarité</p>
              <Badge variant="secondary">{dossier.beneficiary.precarityStatus}</Badge>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">
                {dossier.beneficiary.address}<br />
                {dossier.beneficiary.postalCode} {dossier.beneficiary.city}
              </p>
            </div>
            {dossier.beneficiary.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{dossier.beneficiary.email}</p>
              </div>
            )}
            {dossier.beneficiary.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{dossier.beneficiary.phone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Devis', 'Facture', 'Attestation Honneur', 'Cadre Contribution', 'Photos'].map((docType, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{docType}</p>
                    <p className="text-sm text-muted-foreground">document_{i + 1}.pdf</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Traité</Badge>
                  <ConfidenceIndicator value={95 + i} showPercentage={false} className="w-20" />
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data */}
      <Card>
        <CardHeader>
          <CardTitle>Données extraites</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="identification">
              <AccordionTrigger>Identification</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {extractedData.identification.map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{field.label}</p>
                        <p className="font-medium">{field.value}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{field.source}</Badge>
                        <ConfidenceIndicator value={field.confidence} showPercentage={false} className="w-16" />
                        <span className="text-xs text-muted-foreground">{field.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="financial">
              <AccordionTrigger>Financier</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {extractedData.financial.map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{field.label}</p>
                        <p className="font-medium">{field.value}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{field.source}</Badge>
                        <ConfidenceIndicator value={field.confidence} showPercentage={false} className="w-16" />
                        <span className="text-xs text-muted-foreground">{field.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="technical">
              <AccordionTrigger>Technique</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {extractedData.technical.map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{field.label}</p>
                        <p className="font-medium">{field.value}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{field.source}</Badge>
                        <ConfidenceIndicator value={field.confidence} showPercentage={false} className="w-16" />
                        <span className="text-xs text-muted-foreground">{field.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Validation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Résultats de validation</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                {validationResults.passed} réussies
              </span>
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                {validationResults.warnings} avertissements
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                {validationResults.errors} erreurs
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {validationResults.rules.map((rule, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  rule.status === 'passed' ? 'bg-green-50' :
                  rule.status === 'warning' ? 'bg-yellow-50' :
                  'bg-red-50'
                }`}
              >
                {rule.status === 'passed' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                {rule.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                {rule.status === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                <div className="flex-1">
                  <p className="font-medium">{rule.name}</p>
                  {rule.message && (
                    <p className="text-sm text-muted-foreground mt-1">{rule.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique d'activité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    activity.type === 'success' ? 'bg-green-100' :
                    activity.type === 'error' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  {i < activities.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.user} • {format(activity.date, 'PPp', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}