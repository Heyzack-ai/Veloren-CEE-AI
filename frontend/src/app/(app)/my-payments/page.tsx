'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockBillingDossiers, mockBillingActivities } from '@/lib/mock-data/billing';
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  Clock,
  CheckCircle,
  FileText,
  Download,
  TrendingUp,
  AlertCircle,
  Euro,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Info,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Simulate current installer ID (in real app, would come from auth context)
const CURRENT_INSTALLER_ID = 'inst-1';

export default function InstallerPaymentsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('all');

  // Filter dossiers for current installer
  const installerDossiers = useMemo(() => 
    mockBillingDossiers.filter(d => d.installerId === CURRENT_INSTALLER_ID),
    []
  );

  // Calculate summary stats
  const summary = useMemo(() => {
    const approved = installerDossiers.filter(d => d.billingStatus === 'approved');
    const billed = installerDossiers.filter(d => d.billingStatus === 'billed');
    const paid = installerDossiers.filter(d => d.billingStatus === 'paid');
    
    const totalExpected = installerDossiers.reduce((sum, d) => sum + d.primeAmount, 0);
    const totalReceived = paid.reduce((sum, d) => sum + d.primeAmount, 0);
    const totalPending = [...approved, ...billed].reduce((sum, d) => sum + d.primeAmount, 0);
    
    // Payment breakdown (90% on validation, 10% on EMMY)
    const validationPayment = totalReceived * 0.9;
    const emmyPayment = totalReceived * 0.1;
    
    return {
      approved: { count: approved.length, amount: approved.reduce((sum, d) => sum + d.primeAmount, 0) },
      billed: { count: billed.length, amount: billed.reduce((sum, d) => sum + d.primeAmount, 0) },
      paid: { count: paid.length, amount: totalReceived },
      totalExpected,
      totalReceived,
      totalPending,
      validationPayment,
      emmyPayment,
    };
  }, [installerDossiers]);

  // Filter activities for current installer
  const installerActivities = useMemo(() =>
    mockBillingActivities.filter(a => {
      const dossier = mockBillingDossiers.find(d => d.id === a.dossierId);
      return dossier?.installerId === CURRENT_INSTALLER_ID;
    }).slice(0, 10),
    []
  );

  // Get dossiers based on active tab
  const filteredDossiers = useMemo(() => {
    switch (activeTab) {
      case 'approved':
        return installerDossiers.filter(d => d.billingStatus === 'approved');
      case 'billed':
        return installerDossiers.filter(d => d.billingStatus === 'billed');
      case 'paid':
        return installerDossiers.filter(d => d.billingStatus === 'paid');
      default:
        return installerDossiers;
    }
  }, [installerDossiers, activeTab]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">En attente de facturation</Badge>;
      case 'billed':
        return <Badge className="bg-yellow-100 text-yellow-700">Facturé - En attente</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">Payé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Mes paiements</h1>
          <p className="text-muted-foreground mt-1">
            Suivi des primes CEE et paiements
          </p>
        </div>
      </div>

      {/* Period Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Select
            value={currentMonth.toString()}
            onValueChange={(v) => setCurrentMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentYear.toString()}
            onValueChange={(v) => setCurrentYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total reçu</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalReceived)}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">{summary.paid.count} dossier(s) payé(s)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{formatCurrency(summary.totalPending)}</div>
            <p className="text-xs text-yellow-600 mt-1">
              {summary.approved.count + summary.billed.count} dossier(s) en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêts à facturer</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.approved.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary.approved.amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturés</CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.billed.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary.billed.amount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Comment sont calculées vos primes CEE ?</h3>
              <p className="text-sm text-blue-700 mt-1">
                Les primes CEE sont versées en deux temps :
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <strong>90%</strong> à la validation du dossier
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <strong>10%</strong> à la livraison EMMY (registre national CEE)
                </li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                Délai de paiement : 15 jours à compter de la facturation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dossiers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mes dossiers et paiements</CardTitle>
          <CardDescription>
            Suivez le statut de paiement de chacun de vos dossiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                Tous ({installerDossiers.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                À facturer ({summary.approved.count})
              </TabsTrigger>
              <TabsTrigger value="billed">
                En attente ({summary.billed.count})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Payés ({summary.paid.count})
              </TabsTrigger>
            </TabsList>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Opération</TableHead>
                  <TableHead>Date approbation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant Prime</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDossiers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun dossier dans cette catégorie
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDossiers.map((dossier) => (
                    <TableRow key={dossier.id}>
                      <TableCell>
                        <Link href={`/my-payments/${dossier.id}`} className="font-medium hover:underline">
                          {dossier.reference}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dossier.beneficiaryName}</p>
                          <p className="text-sm text-muted-foreground">{dossier.beneficiaryCity}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dossier.processCode}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(dossier.approvedDate, 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(dossier.billingStatus)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(dossier.primeAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(dossier.billingStatus === 'billed' || dossier.billingStatus === 'paid') && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Facture
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/my-payments/${dossier.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Dernières activités de facturation et paiement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {installerActivities.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucune activité de paiement pour le moment
            </p>
          ) : (
            <div className="space-y-4">
              {installerActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    activity.action === 'paid' 
                      ? 'bg-green-100' 
                      : 'bg-blue-100'
                  }`}>
                    {activity.action === 'paid' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Receipt className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.dossierReference}</span>
                      <Badge
                        variant="secondary"
                        className={
                          activity.action === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {activity.action === 'paid' ? 'Paiement reçu' : 'Facture émise'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(activity.date, 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(activity.amount)}</p>
                    {activity.action === 'paid' && (
                      <Button size="sm" variant="ghost" className="mt-1">
                        <Download className="h-4 w-4 mr-1" />
                        Reçu
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations contractuelles</CardTitle>
          <CardDescription>
            Détails de votre contrat de partenariat CEE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Référence contrat</p>
              <p className="font-medium">CTR-2024-001</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tarif par kWh cumac</p>
              <p className="font-medium">0,0045 €</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Délai de paiement</p>
              <p className="font-medium">15 jours</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mode de paiement</p>
              <p className="font-medium">Virement bancaire</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
