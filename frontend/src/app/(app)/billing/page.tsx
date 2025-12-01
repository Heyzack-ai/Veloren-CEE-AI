'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  mockBillingDossiers,
  mockBillingActivities,
  getBillingSummary,
} from '@/lib/mock-data/billing';
import {
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function BillingPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDossiers, setSelectedDossiers] = useState<string[]>([]);

  const summary = useMemo(() => getBillingSummary(currentMonth, currentYear), [currentMonth, currentYear]);
  
  const readyToBillDossiers = mockBillingDossiers.filter(d => d.billingStatus === 'approved');
  const recentActivities = mockBillingActivities.slice(0, 10);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDossiers(readyToBillDossiers.map(d => d.id));
    } else {
      setSelectedDossiers([]);
    }
  };

  const handleSelectDossier = (dossierId: string, checked: boolean) => {
    if (checked) {
      setSelectedDossiers([...selectedDossiers, dossierId]);
    } else {
      setSelectedDossiers(selectedDossiers.filter(id => id !== dossierId));
    }
  };

  const handleGenerateInvoices = () => {
    // Group by installer
    const byInstaller = selectedDossiers.reduce((acc, id) => {
      const dossier = readyToBillDossiers.find(d => d.id === id);
      if (dossier) {
        if (!acc[dossier.installerId]) {
          acc[dossier.installerId] = [];
        }
        acc[dossier.installerId].push(dossier);
      }
      return acc;
    }, {} as Record<string, typeof readyToBillDossiers>);
    
    console.log('Generating invoices grouped by installer:', byInstaller);
    alert(`Génération de ${Object.keys(byInstaller).length} facture(s) pour ${selectedDossiers.length} dossier(s)`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Facturation</h1>
          <p className="text-muted-foreground mt-1">
            {months[currentMonth]} {currentYear}
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

      {/* Billing Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêts à facturer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.readyToBill.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.readyToBill.amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturés ce mois</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.billedThisMonth.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.billedThisMonth.amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payés ce mois</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.paidThisMonth.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.paidThisMonth.amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.outstanding.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.outstanding.amount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ready to Bill Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prêts à facturer</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Dossiers approuvés en attente de facturation
              </p>
            </div>
            {selectedDossiers.length > 0 && (
              <Button onClick={handleGenerateInvoices}>
                <FileText className="h-4 w-4 mr-2" />
                Générer {selectedDossiers.length} facture(s)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDossiers.length === readyToBillDossiers.length && readyToBillDossiers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Installateur</TableHead>
                <TableHead>Processus</TableHead>
                <TableHead>Date approbation</TableHead>
                <TableHead className="text-right">Montant Prime</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readyToBillDossiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun dossier prêt à facturer
                  </TableCell>
                </TableRow>
              ) : (
                readyToBillDossiers.map((dossier) => (
                  <TableRow key={dossier.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDossiers.includes(dossier.id)}
                        onCheckedChange={(checked) => handleSelectDossier(dossier.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/billing/${dossier.id}`} className="font-medium hover:underline">
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
                      <Link href={`/installers/${dossier.installerId}`} className="hover:underline">
                        {dossier.installerName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{dossier.processCode}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(dossier.approvedDate, 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(dossier.primeAmount)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" asChild>
                        <Link href={`/billing/${dossier.id}`}>
                          Facturer
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dernières actions de facturation
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Installateur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <Link href={`/billing/${activity.dossierId}`} className="font-medium hover:underline">
                      {activity.dossierReference}
                    </Link>
                  </TableCell>
                  <TableCell>{activity.installerName}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(activity.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        activity.action === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }
                    >
                      {activity.action === 'paid' ? 'Payé' : 'Facturé'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(activity.date, 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {activity.user}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
