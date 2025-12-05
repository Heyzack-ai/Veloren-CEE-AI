'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { StatusTimeline } from '@/components/status-timeline';
import { ProcessTabs } from '@/components/process-tabs';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { DossierMilestone, ValidationFeedback } from '@/types/installer';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PageProps = {
  params: { id: string };
};

export default function InstallerDossierDetailPage({ params }: PageProps) {
  const { id } = params;
  const dossier = mockDossiers.find((d) => d.id === id);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);

  if (!dossier) {
    notFound();
  }

  // Get active process
  const activeProcess = useMemo(() => {
    if (!dossier.processes || dossier.processes.length === 0) return null;
    if (activeProcessId) {
      return dossier.processes.find(p => p.id === activeProcessId) || dossier.processes[0];
    }
    return dossier.processes[0];
  }, [dossier.processes, activeProcessId]);

  const currentStatus = activeProcess?.status || dossier.status;
  const currentProcessName = activeProcess?.processName || dossier.processName;
  const currentProcessCode = activeProcess?.processCode || dossier.processCode;

  // Mock milestones
  const milestones: DossierMilestone[] = [
    {
      id: '1',
      name: 'Soumis',
      status: 'completed',
      completedAt: dossier.submittedAt,
      description: 'Documents téléchargés et dossier créé',
    },
    {
      id: '2',
      name: 'Traitement terminé',
      status: dossier.status === 'processing' ? 'current' : 'completed',
      completedAt:
        dossier.status !== 'draft' && dossier.status !== 'processing'
          ? new Date(dossier.submittedAt.getTime() + 3600000)
          : undefined,
      description: 'Extraction des données et vérifications automatiques',
    },
    {
      id: '3',
      name: 'Validation terminée',
      status:
        dossier.status === 'awaiting_review'
          ? 'current'
          : dossier.status === 'approved' || dossier.status === 'rejected' || dossier.status === 'billed' || dossier.status === 'paid'
          ? 'completed'
          : 'pending',
      completedAt: dossier.validatedAt,
      description: 'Vérification manuelle par un validateur',
    },
    {
      id: '4',
      name: 'Paiement initié',
      status: dossier.status === 'paid' || dossier.status === 'billed' ? 'completed' : 'pending',
      completedAt:
        dossier.status === 'paid' || dossier.status === 'billed'
          ? new Date(dossier.submittedAt.getTime() + 7200000)
          : undefined,
      description: 'Prime CEE en cours de traitement',
    },
  ];

  // Mock validation feedback for rejected dossiers
  const validationFeedback: ValidationFeedback | null =
    dossier.status === 'rejected'
      ? {
          id: 'feedback-1',
          type: 'rejection',
          reason: 'Documents incomplets ou non conformes',
          corrections: [
            {
              documentType: 'Devis',
              issue: 'La prime CEE n\'est pas clairement mentionnée',
              required: true,
            },
            {
              documentType: 'Photos',
              issue: 'Plaque signalétique de l\'équipement non visible',
              required: true,
            },
          ],
          createdAt: new Date(),
          createdBy: 'Marie Validator',
        }
      : null;

  return (
    <div className="space-y-6">
      {/* Process Tabs - Show when dossier has multiple processes */}
      {dossier.processes && dossier.processes.length > 1 && (
        <ProcessTabs
          processes={dossier.processes}
          activeProcessId={activeProcess?.id || dossier.processes[0].id}
          onProcessChange={setActiveProcessId}
          className="-mx-6 -mt-6 mb-6"
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/my-dossiers" className="hover:text-foreground">
          Mes dossiers
        </Link>
        <span>/</span>
        <span className="text-foreground">{dossier.reference}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold">{dossier.reference}</h1>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-muted-foreground">{currentProcessCode} - {currentProcessName}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/my-dossiers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Statut du dossier</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline milestones={milestones} />
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
                {dossier.beneficiary.address}
                <br />
                {dossier.beneficiary.postalCode} {dossier.beneficiary.city}
              </p>
            </div>
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
            {['Devis', 'Facture', 'Attestation Honneur', 'Cadre Contribution', 'Photos'].map(
              (docType, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{docType}</p>
                      <p className="text-sm text-muted-foreground">document_{i + 1}.pdf</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Result */}
      {(dossier.status === 'approved' || dossier.status === 'rejected') && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat de validation</CardTitle>
          </CardHeader>
          <CardContent>
            {dossier.status === 'approved' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Dossier approuvé</p>
                  <p className="text-sm text-green-700 mt-1">
                    Votre dossier a été approuvé le{' '}
                    {dossier.validatedAt && format(dossier.validatedAt, 'PPP', { locale: fr })}
                  </p>
                </div>
              </div>
            )}

            {dossier.status === 'rejected' && validationFeedback && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Dossier rejeté</p>
                    <p className="text-sm text-red-700 mt-1">{validationFeedback.reason}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Corrections requises</h3>
                  <div className="space-y-2">
                    {validationFeedback.corrections.map((correction, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{correction.documentType}</p>
                          <p className="text-sm text-muted-foreground mt-1">{correction.issue}</p>
                        </div>
                        {correction.required && (
                          <Badge variant="destructive" className="text-xs">
                            Requis
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link href={`/upload?resubmit=${dossier.id}&corrections=${encodeURIComponent(validationFeedback.corrections.map(c => c.documentType).join(','))}`}>
                    <Upload className="h-4 w-4 mr-2" />
                    Soumettre les documents corrigés
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing Information */}
      {(dossier.status === 'approved' || dossier.status === 'billed' || dossier.status === 'paid') && (
        <Card>
          <CardHeader>
            <CardTitle>Informations de facturation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Montant de la prime</p>
                <p className="text-2xl font-bold">2 500 €</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut du paiement</p>
                <StatusBadge status={dossier.status} />
              </div>
              {dossier.status === 'paid' && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de paiement</p>
                    <p className="font-medium">
                      {format(new Date(), 'PPP', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Référence de paiement</p>
                    <p className="font-medium">PAY-2025-{id.slice(-4)}</p>
                  </div>
                </>
              )}
              {dossier.status === 'billed' && (
                <div>
                  <p className="text-sm text-muted-foreground">Date de paiement prévue</p>
                  <p className="font-medium">
                    {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'PPP', {
                      locale: fr,
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}