'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload,
  FileText,
  CheckCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Wallet,
} from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { mockBillingDossiers } from '@/lib/mock-data/billing';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Simulate current installer ID
const CURRENT_INSTALLER_ID = 'inst-1';

type KPICardProps = {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  variant?: 'orange' | 'blue' | 'green' | 'purple';
};

function KPICard({ title, value, change, changeLabel, icon, variant = 'blue' }: KPICardProps) {
  const variantClasses = {
    orange: 'bg-orange-50 border-orange-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-muted-foreground">{changeLabel}</span>
            </div>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstallerDashboard() {
  const { user } = useAuth();
  
  // Mock data for installer
  const myDossiers = mockDossiers.slice(0, 10);
  const activeDossiers = myDossiers.filter(d => 
    ['processing', 'awaiting_review'].includes(d.status)
  ).length;
  const approvedThisMonth = myDossiers.filter(d => d.status === 'approved').length;
  const pendingPayment = myDossiers.filter(d => d.status === 'billed').length;

  // Payment summary from billing data
  const installerBillingDossiers = mockBillingDossiers.filter(d => d.installerId === CURRENT_INSTALLER_ID);
  const totalReceived = installerBillingDossiers
    .filter(d => d.billingStatus === 'paid')
    .reduce((sum, d) => sum + d.primeAmount, 0);
  const totalPending = installerBillingDossiers
    .filter(d => d.billingStatus === 'approved' || d.billingStatus === 'billed')
    .reduce((sum, d) => sum + d.primeAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Bienvenue</h1>
        <p className="text-muted-foreground mt-1">
          EcoTherm Solutions • {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Dossiers actifs"
          value={activeDossiers}
          change={8}
          changeLabel="vs mois dernier"
          icon={<FileText className="h-8 w-8" />}
          variant="blue"
        />
        <KPICard
          title="Approuvés ce mois"
          value={approvedThisMonth}
          change={15}
          changeLabel="vs mois dernier"
          icon={<CheckCircle className="h-8 w-8" />}
          variant="green"
        />
        <KPICard
          title="En attente de paiement"
          value={pendingPayment}
          change={-5}
          changeLabel="vs mois dernier"
          icon={<CreditCard className="h-8 w-8" />}
          variant="purple"
        />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Submit New Dossier CTA */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-heading font-semibold mb-1">
                  Démarrer un nouveau dossier CEE
                </h3>
                <p className="text-muted-foreground">
                  Téléchargez vos documents et soumettez un nouveau dossier pour validation
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger documents
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Dossiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mes dossiers récents</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/my-dossiers">Voir tous mes dossiers</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myDossiers.map((dossier) => (
                <div
                  key={dossier.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{dossier.reference}</span>
                      <StatusBadge status={dossier.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dossier.beneficiary.name} • {dossier.processCode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Soumis {formatDistanceToNow(dossier.submittedAt, { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/my-dossiers/${dossier.id}`}>Voir</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Mes paiements
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/my-payments">Voir tous les paiements</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-white/50">
                <p className="text-sm text-muted-foreground">Total reçu</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalReceived)}</p>
                <p className="text-xs text-green-600 mt-1">
                  {installerBillingDossiers.filter(d => d.billingStatus === 'paid').length} dossier(s) payé(s)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/50">
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {installerBillingDossiers.filter(d => d.billingStatus === 'approved' || d.billingStatus === 'billed').length} dossier(s) en cours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  message: 'Dossier VAL-2025-0089 a été approuvé',
                  time: '2 heures',
                  unread: true,
                },
                {
                  message: 'Dossier VAL-2025-0087 nécessite des corrections',
                  time: '5 heures',
                  unread: true,
                },
                {
                  message: 'Paiement reçu pour VAL-2025-0085',
                  time: '1 jour',
                  unread: false,
                },
                {
                  message: 'Dossier VAL-2025-0083 en cours de validation',
                  time: '2 jours',
                  unread: false,
                },
              ].map((notif, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    notif.unread ? 'bg-blue-50' : 'bg-muted/30'
                  }`}
                >
                  {notif.unread && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">Il y a {notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}