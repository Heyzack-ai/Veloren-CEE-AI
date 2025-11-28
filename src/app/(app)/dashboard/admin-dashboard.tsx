'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Upload,
  Users,
  Settings as SettingsIcon,
} from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';

type KPICardProps = {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  href?: string;
  variant?: 'orange' | 'blue' | 'green' | 'purple';
};

function KPICard({ title, value, change, changeLabel, icon, href, variant = 'blue' }: KPICardProps) {
  const variantClasses = {
    orange: 'bg-orange-50 border-orange-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  const content = (
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

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  
  const pendingDossiers = mockDossiers.filter(d => d.status === 'awaiting_review');
  const pendingCount = pendingDossiers.length;
  const processedToday = mockDossiers.filter(d => {
    const today = new Date();
    return d.updatedAt.toDateString() === today.toDateString();
  }).length;
  const approvedDossiers = mockDossiers.filter(d => d.status === 'approved');
  const approvedCount = approvedDossiers.length;
  const totalCount = mockDossiers.length;
  const accuracyRate = Math.round((approvedCount / totalCount) * 100);
  const avgProcessingTime = 45; // minutes

  // New dossiers = submitted in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newDossiers = mockDossiers.filter(d => d.submittedAt >= sevenDaysAgo);
  const newCount = newDossiers.length;

  const recentDossiers = mockDossiers.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} • {t('dashboard.welcome', { name: user?.name })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t('dashboard.stats.validation')}
          value={pendingCount}
          change={12}
          changeLabel={t('dashboard.stats.vsYesterday', { percent: 12 })}
          icon={<AlertCircle className="h-8 w-8" />}
          variant="orange"
          href="/dossiers?status=awaiting_review"
        />
        <KPICard
          title={t('dashboard.stats.processed')}
          value={processedToday}
          change={8}
          changeLabel={t('dashboard.stats.vsSemLastWeek', { percent: 8 })}
          icon={<CheckCircle className="h-8 w-8" />}
          variant="blue"
        />
        <KPICard
          title={t('dashboard.stats.accuracy')}
          value={`${accuracyRate}%`}
          change={3}
          changeLabel={t('dashboard.stats.vsLastWeek', { percent: 3 })}
          icon={<TrendingUp className="h-8 w-8" />}
          variant="green"
          href="/analytics"
        />
        <KPICard
          title={t('dashboard.stats.avgTime')}
          value={`${avgProcessingTime}min`}
          change={-5}
          changeLabel={t('dashboard.stats.improvement', { percent: 5 })}
          icon={<Clock className="h-8 w-8" />}
          variant="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dossiers Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.cases.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">{t('dashboard.cases.all', { count: mockDossiers.length })}</TabsTrigger>
                  <TabsTrigger value="new">{t('dashboard.cases.new', { count: newCount })}</TabsTrigger>
                  <TabsTrigger value="pending">{t('dashboard.cases.pending', { count: pendingCount })}</TabsTrigger>
                  <TabsTrigger value="approved">{t('dashboard.cases.approved', { count: approvedCount })}</TabsTrigger>
                </TabsList>
                
                {/* All Dossiers Tab */}
                <TabsContent value="all" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {recentDossiers.map((dossier) => (
                      <Link
                        key={dossier.id}
                        href={`/dossiers/${dossier.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{dossier.reference}</span>
                            <StatusBadge status={dossier.status} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {dossier.beneficiary.name} • {dossier.processCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="w-24">
                            <ConfidenceIndicator value={dossier.confidence} showPercentage={false} />
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(dossier.submittedAt, { addSuffix: true, locale: lang === 'fr' ? fr : enUS })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dossiers">{t('dashboard.cases.viewAll')}</Link>
                  </Button>
                </TabsContent>

                {/* New Dossiers Tab */}
                <TabsContent value="new" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {newDossiers.slice(0, 10).map((dossier) => (
                      <Link
                        key={dossier.id}
                        href={`/dossiers/${dossier.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{dossier.reference}</span>
                            <StatusBadge status={dossier.status} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {dossier.beneficiary.name} • {dossier.processCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="w-24">
                            <ConfidenceIndicator value={dossier.confidence} showPercentage={false} />
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(dossier.submittedAt, { addSuffix: true, locale: lang === 'fr' ? fr : enUS })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {newDossiers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">{t('dashboard.cases.noNew')}</p>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dossiers">{t('dashboard.cases.viewAll')}</Link>
                  </Button>
                </TabsContent>

                {/* Pending Dossiers Tab */}
                <TabsContent value="pending" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {pendingDossiers.slice(0, 10).map((dossier) => (
                      <Link
                        key={dossier.id}
                        href={`/validation/${dossier.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{dossier.reference}</span>
                            <StatusBadge status={dossier.status} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {dossier.beneficiary.name} • {dossier.processCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="w-24">
                            <ConfidenceIndicator value={dossier.confidence} showPercentage={false} />
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(dossier.submittedAt, { addSuffix: true, locale: lang === 'fr' ? fr : enUS })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {pendingDossiers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">{t('dashboard.cases.noPending')}</p>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dossiers?status=awaiting_review">{t('dashboard.cases.viewAll')}</Link>
                  </Button>
                </TabsContent>

                {/* Approved Dossiers Tab */}
                <TabsContent value="approved" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {approvedDossiers.slice(0, 10).map((dossier) => (
                      <Link
                        key={dossier.id}
                        href={`/dossiers/${dossier.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{dossier.reference}</span>
                            <StatusBadge status={dossier.status} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {dossier.beneficiary.name} • {dossier.processCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="w-24">
                            <ConfidenceIndicator value={dossier.confidence} showPercentage={false} />
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(dossier.submittedAt, { addSuffix: true, locale: lang === 'fr' ? fr : enUS })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {approvedDossiers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">{t('dashboard.cases.noApproved')}</p>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dossiers?status=approved">{t('dashboard.cases.viewAll')}</Link>
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.actions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link href="/upload">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">{t('dashboard.actions.newCase')}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link href="/installers/new">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">{t('dashboard.actions.addInstaller')}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link href="/config/processes">
                  <SettingsIcon className="h-5 w-5" />
                  <span className="text-xs">{t('dashboard.actions.configProcesses')}</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link href="/analytics">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">{t('dashboard.actions.viewReports')}</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.system.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { nameKey: 'dashboard.system.api', status: 'healthy' },
                  { nameKey: 'dashboard.system.database', status: 'healthy' },
                  { nameKey: 'dashboard.system.storage', status: 'healthy' },
                  { nameKey: 'dashboard.system.ai', status: 'healthy' },
                  { nameKey: 'dashboard.system.search', status: 'healthy' },
                ].map((service) => (
                  <div key={service.nameKey} className="flex items-center justify-between">
                    <span className="text-sm">{t(service.nameKey)}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">{t('dashboard.system.operational')}</span>
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