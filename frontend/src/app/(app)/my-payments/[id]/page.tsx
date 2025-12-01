'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  mockBillingDossiers,
  getCEECalculation,
  getPaymentBreakdown,
  getCommunicationLog,
} from '@/lib/mock-data/billing';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  Clock,
  Euro,
  Calendar,
  Building,
  User,
  MapPin,
  Receipt,
  Wallet,
  AlertCircle,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PageProps = {
  params: { id: string };
};

export default function InstallerPaymentDetailPage({ params }: PageProps) {
  const { id } = params;
  const dossier = mockBillingDossiers.find((d) => d.id === id);

  if (!dossier) {
    notFound();
  }

  const ceeCalculation = getCEECalculation(id);
  const paymentBreakdown = getPaymentBreakdown(id);
  const communicationLog = getCommunicationLog(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'En attente de facturation',
          color: 'bg-blue-100 text-blue-700',
          icon: Clock,
          description: 'Le dossier est approuvé et sera facturé prochainement.',
        };
      case 'billed':
        return {
          label: 'Facturé - En attente de paiement',
          color: 'bg-yellow-100 text-yellow-700',
          icon: Receipt,
          description: 'La facture a été émise. Le paiement est en cours de traitement.',
        };
      case 'paid':
        return {
          label: 'Payé',
          color: 'bg-green-100 text-green-700',
          icon: CheckCircle,
          description: 'Le paiement a été effectué avec succès.',
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-700',
          icon: AlertCircle,
          description: '',
        };
    }
  };

  const statusInfo = getStatusInfo(dossier.billingStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/my-payments" className="hover:text-foreground">
          Mes paiements
        </Link>
        <span>/</span>
        <span className="text-foreground">{dossier.reference}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold">{dossier.reference}</h1>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </div>
          <p className="text-muted-foreground">{dossier.processName}</p>
        </div>
        <div className="flex gap-2">
          {(dossier.billingStatus === 'billed' || dossier.billingStatus === 'paid') && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger la facture
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/my-payments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${
        dossier.billingStatus === 'paid' ? 'border-green-200 bg-green-50' :
        dossier.billingStatus === 'billed' ? 'border-yellow-200 bg-yellow-50' :
        'border-blue-200 bg-blue-50'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              dossier.billingStatus === 'paid' ? 'bg-green-200' :
              dossier.billingStatus === 'billed' ? 'bg-yellow-200' :
              'bg-blue-200'
            }`}>
              <StatusIcon className={`h-6 w-6 ${
                dossier.billingStatus === 'paid' ? 'text-green-700' :
                dossier.billingStatus === 'billed' ? 'text-yellow-700' :
                'text-blue-700'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{statusInfo.label}</h2>
              <p className="text-muted-foreground mt-1">{statusInfo.description}</p>
              
              {dossier.billingStatus === 'billed' && dossier.dueDate && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Date d'échéance : {format(dossier.dueDate, 'PPP', { locale: fr })}</span>
                </div>
              )}
              
              {dossier.billingStatus === 'paid' && dossier.paymentDate && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Payé le {format(dossier.paymentDate, 'PPP', { locale: fr })}</span>
                  {dossier.paymentReference && (
                    <span className="text-muted-foreground">• Réf: {dossier.paymentReference}</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Montant de la prime</p>
              <p className="text-3xl font-bold">{formatCurrency(dossier.primeAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Beneficiary Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Bénéficiaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{dossier.beneficiaryName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">{dossier.beneficiaryAddress}</p>
              <p className="font-medium">{dossier.beneficiaryCity}</p>
            </div>
          </CardContent>
        </Card>

        {/* Operation Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Opération CEE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Code opération</p>
              <p className="font-medium">{dossier.processCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{dossier.processName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date d'approbation</p>
              <p className="font-medium">{format(dossier.approvedDate, 'PPP', { locale: fr })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CEE Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Calcul de la prime CEE
          </CardTitle>
          <CardDescription>
            Détail du calcul des kWh cumac et du montant de la prime
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Paramètres du calcul</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Code opération</p>
                  <p className="font-medium">{ceeCalculation.operationCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Zone climatique</p>
                  <p className="font-medium">{ceeCalculation.climateZone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Surface chauffée</p>
                  <p className="font-medium">{ceeCalculation.heatedSurface} m²</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type de bâtiment</p>
                  <p className="font-medium">{ceeCalculation.buildingType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Énergie remplacée</p>
                  <p className="font-medium">{ceeCalculation.replacedEnergySource}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut précarité</p>
                  <p className="font-medium">{ceeCalculation.precarityStatus}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Résultat</h3>
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">kWh cumac calculés</span>
                  <span className="font-medium">{ceeCalculation.kWhCumac.toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix par kWh cumac</span>
                  <span className="font-medium">{ceeCalculation.pricePerKWh} €</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Prime CEE totale</span>
                  <span className="font-bold text-primary">{formatCurrency(ceeCalculation.totalPrime)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Répartition du paiement
          </CardTitle>
          <CardDescription>
            Le paiement est effectué en deux versements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Paiement à la validation</p>
                  <p className="text-sm text-muted-foreground">90% du montant total</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{formatCurrency(paymentBreakdown.paymentOnValidation)}</p>
                {dossier.billingStatus === 'paid' ? (
                  <Badge className="bg-green-100 text-green-700">Versé</Badge>
                ) : dossier.billingStatus === 'billed' ? (
                  <Badge className="bg-yellow-100 text-yellow-700">En attente</Badge>
                ) : (
                  <Badge variant="secondary">À venir</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Paiement à la livraison EMMY</p>
                  <p className="text-sm text-muted-foreground">10% du montant total</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{formatCurrency(paymentBreakdown.paymentOnEmmyDelivery)}</p>
                <Badge variant="secondary">Après dépôt EMMY</Badge>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-muted">
              <div className="flex justify-between items-center">
                <span className="font-medium">Conditions de paiement</span>
                <span className="text-muted-foreground">{paymentBreakdown.paymentTerms}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Info */}
      {(dossier.billingStatus === 'billed' || dossier.billingStatus === 'paid') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Facture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numéro de facture</p>
                <p className="font-medium">{dossier.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d'émission</p>
                <p className="font-medium">
                  {dossier.invoiceDate && format(dossier.invoiceDate, 'PPP', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d'échéance</p>
                <p className="font-medium">
                  {dossier.dueDate && format(dossier.dueDate, 'PPP', { locale: fr })}
                </p>
              </div>
              <div>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Communication Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historique des communications
          </CardTitle>
          <CardDescription>
            Suivi des actions liées à la facturation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {communicationLog.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucune communication pour le moment
            </p>
          ) : (
            <div className="space-y-4">
              {communicationLog.map((entry, index) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      entry.action === 'payment_received' ? 'bg-green-100' :
                      entry.action === 'invoice_sent' ? 'bg-blue-100' :
                      entry.action === 'payment_reminder' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {entry.action === 'payment_received' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : entry.action === 'invoice_sent' ? (
                        <Mail className="h-4 w-4 text-blue-600" />
                      ) : entry.action === 'payment_reminder' ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    {index < communicationLog.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{format(entry.date, 'PPP à HH:mm', { locale: fr })}</span>
                      <span>•</span>
                      <span>{entry.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
