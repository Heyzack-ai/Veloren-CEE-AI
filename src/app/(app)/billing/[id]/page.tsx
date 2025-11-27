'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
import {
  mockBillingDossiers,
  getCEECalculation,
  getPaymentBreakdown,
  getInstallerBillingInfo,
  getCommunicationLog,
} from '@/lib/mock-data/billing';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Download,
  Mail,
  CheckCircle,
  Clock,
  Send,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PageProps = {
  params: { id: string };
};

export default function BillingDetailPage({ params }: PageProps) {
  const { id } = params;
  const dossier = mockBillingDossiers.find(d => d.id === id);

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!dossier) {
    notFound();
  }

  const ceeCalculation = getCEECalculation(id);
  const paymentBreakdown = getPaymentBreakdown(id);
  const installerInfo = getInstallerBillingInfo(dossier.installerId);
  const communicationLog = getCommunicationLog(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleGenerateInvoice = () => {
    console.log('Generating invoice with:', { invoiceDate, invoiceNotes });
    setShowInvoiceDialog(false);
    alert('Facture générée avec succès!');
  };

  const handleMarkAsPaid = () => {
    console.log('Marking as paid with:', { paymentDate, paymentReference, paymentMethod, paymentNotes });
    setShowPaymentDialog(false);
    alert('Paiement enregistré avec succès!');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'invoice_generated':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'invoice_sent':
        return <Send className="h-4 w-4 text-green-600" />;
      case 'payment_reminder':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'payment_received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link href="/billing" className="hover:text-foreground">Facturation</Link>
        <span>/</span>
        <span className="text-foreground">{dossier.reference}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/billing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold">
              Facturation - {dossier.reference}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={
                  dossier.billingStatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : dossier.billingStatus === 'billed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }
              >
                {dossier.billingStatus === 'paid' ? 'Payé' :
                 dossier.billingStatus === 'billed' ? 'Facturé' : 'À facturer'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {dossier.billingStatus === 'approved' && (
            <Button onClick={() => setShowInvoiceDialog(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Générer la facture
            </Button>
          )}
          {dossier.billingStatus === 'billed' && (
            <>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par email
              </Button>
              <Button onClick={() => setShowPaymentDialog(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Marquer comme payé
              </Button>
            </>
          )}
          {dossier.invoiceNumber && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dossier Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé du dossier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Référence</p>
                <p className="font-medium">{dossier.reference}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processus</p>
                <p className="font-medium">{dossier.processCode}</p>
                <p className="text-sm text-muted-foreground">{dossier.processName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bénéficiaire</p>
                <p className="font-medium">{dossier.beneficiaryName}</p>
                <p className="text-sm text-muted-foreground">{dossier.beneficiaryAddress}</p>
                <p className="text-sm text-muted-foreground">{dossier.beneficiaryCity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Installateur</p>
                <Link href={`/installers/${dossier.installerId}`} className="font-medium hover:underline text-primary">
                  {dossier.installerName}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d'approbation</p>
                <p className="font-medium">{format(dossier.approvedDate, 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approuvé par</p>
                <p className="font-medium">{dossier.approvedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CEE Calculation */}
        <Card>
          <CardHeader>
            <CardTitle>Calcul CEE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">kWh cumac calculés</p>
                <p className="font-medium">{ceeCalculation.kWhCumac.toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Prix par kWh</p>
                <p className="font-medium">{ceeCalculation.pricePerKWh.toFixed(4)} €</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <p className="text-lg font-semibold">Prime CEE Totale</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(ceeCalculation.totalPrime)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des paiements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Montant total de la prime</p>
                <p className="font-semibold">{formatCurrency(paymentBreakdown.totalAmount)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Paiement à la validation (90%)</p>
                <p className="font-medium">{formatCurrency(paymentBreakdown.paymentOnValidation)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Paiement livraison EMMY (10%)</p>
                <p className="font-medium">{formatCurrency(paymentBreakdown.paymentOnEmmyDelivery)}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Conditions de paiement</p>
                <p className="font-medium">{paymentBreakdown.paymentTerms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations installateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Raison sociale</p>
                <p className="font-medium">{installerInfo.companyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SIRET</p>
                <p className="font-medium">{installerInfo.siret}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact</p>
                <p className="font-medium">{installerInfo.contactName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{installerInfo.contactEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Référence contrat</p>
                <p className="font-medium">{installerInfo.contractReference}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tarification contrat</p>
                <p className="font-medium">{installerInfo.contractPricing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle>Statut de la facture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dossier.invoiceNumber ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Numéro de facture</p>
                  <p className="font-medium">{dossier.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date de facturation</p>
                  <p className="font-medium">
                    {dossier.invoiceDate && format(dossier.invoiceDate, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date d'échéance</p>
                  <p className="font-medium">
                    {dossier.dueDate && format(dossier.dueDate, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut du paiement</p>
                  <Badge
                    variant="secondary"
                    className={dossier.billingStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                  >
                    {dossier.billingStatus === 'paid' ? 'Payé' : 'En attente'}
                  </Badge>
                </div>
                {dossier.paymentDate && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Date de paiement</p>
                      <p className="font-medium">{format(dossier.paymentDate, 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Référence paiement</p>
                      <p className="font-medium">{dossier.paymentReference}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune facture générée</p>
                <p className="text-sm mt-1">Cliquez sur "Générer la facture" pour créer la facture</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communication Log */}
        <Card>
          <CardHeader>
            <CardTitle>Journal des communications</CardTitle>
          </CardHeader>
          <CardContent>
            {communicationLog.length > 0 ? (
              <div className="space-y-4">
                {communicationLog.map((entry, index) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-muted">
                        {getActionIcon(entry.action)}
                      </div>
                      {index < communicationLog.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(entry.date, 'dd MMM yyyy à HH:mm', { locale: fr })} • {entry.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune communication enregistrée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Générer la facture</DialogTitle>
            <DialogDescription>
              Prévisualisation et génération de la facture pour {dossier.reference}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installateur</span>
                <span className="font-medium">{dossier.installerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bénéficiaire</span>
                <span className="font-medium">{dossier.beneficiaryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-bold text-primary">{formatCurrency(dossier.primeAmount)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Date de facturation</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNotes">Notes (optionnel)</Label>
              <Textarea
                id="invoiceNotes"
                placeholder="Ajouter des notes à la facture..."
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleGenerateInvoice}>
              <FileText className="h-4 w-4 mr-2" />
              Générer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enregistrer le paiement</DialogTitle>
            <DialogDescription>
              Marquer la facture {dossier.invoiceNumber} comme payée
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Date de paiement</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Référence du paiement</Label>
              <Input
                id="paymentReference"
                placeholder="VIR-20241128-001"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes (optionnel)</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Ajouter des notes..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleMarkAsPaid}>
              <CreditCard className="h-4 w-4 mr-2" />
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
