'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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

export default function ValidatorDashboard() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();

  // Mock data for validator
  const myQueueDossiers = mockDossiers
    .filter(d => d.assignedValidatorId === user?.id && d.status === 'awaiting_review')
    .slice(0, 5);

  const unassignedDossiers = mockDossiers
    .filter(d => !d.assignedValidatorId && d.status === 'awaiting_review')
    .slice(0, 3);

  const validatedToday = 8;
  const totalPending = mockDossiers.filter(d => d.status === 'awaiting_review').length;
  const teamAccuracy = 94;

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
          title={t('dashboard.validator.myQueue')}
          value={myQueueDossiers.length}
          change={-15}
          changeLabel={t('dashboard.validator.vsYesterday')}
          icon={<AlertCircle className="h-8 w-8" />}
          variant="orange"
        />
        <KPICard
          title={t('dashboard.validator.validatedToday')}
          value={validatedToday}
          change={12}
          changeLabel={t('dashboard.validator.vsYesterday')}
          icon={<CheckCircle className="h-8 w-8" />}
          variant="blue"
        />
        <KPICard
          title={t('dashboard.validator.totalPending')}
          value={totalPending}
          change={5}
          changeLabel={t('dashboard.validator.vsYesterday')}
          icon={<Clock className="h-8 w-8" />}
          variant="purple"
        />
        <KPICard
          title={t('dashboard.validator.teamAccuracy')}
          value={`${teamAccuracy}%`}
          change={2}
          changeLabel={t('dashboard.validator.vsLastWeek')}
          icon={<TrendingUp className="h-8 w-8" />}
          variant="green"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Validation Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('dashboard.validator.myValidationQueue')}</CardTitle>
              <Button asChild size="sm">
                <Link href="/validation">{t('dashboard.validator.viewAll')}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myQueueDossiers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>{t('dashboard.validator.noPending')}</p>
                    <p className="text-sm">{t('dashboard.validator.excellentWork')}</p>
                  </div>
                ) : (
                  myQueueDossiers.map((dossier) => (
                    <div
                      key={dossier.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        dossier.priority === 'high' ? 'border-l-red-500 bg-red-50' :
                        dossier.priority === 'normal' ? 'border-l-yellow-500 bg-yellow-50' :
                        'border-l-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{dossier.reference}</span>
                            {dossier.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">{t('dashboard.validator.priority')}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {dossier.beneficiary.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {dossier.processCode} • {dossier.installerName}
                          </p>
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/validation/${dossier.id}`}>{t('dashboard.validator.validate')}</Link>
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex-1">
                          <ConfidenceIndicator value={dossier.confidence} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(dossier.submittedAt, { addSuffix: true, locale: lang === 'fr' ? fr : enUS })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {unassignedDossiers.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-3">{t('dashboard.validator.unassigned')}</h3>
                  <div className="space-y-2">
                    {unassignedDossiers.map((dossier) => (
                      <div
                        key={dossier.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <div>
                          <span className="font-medium text-sm">{dossier.reference}</span>
                          <p className="text-xs text-muted-foreground">{dossier.beneficiary.name}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          {t('dashboard.validator.takeCharge')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Validations */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.validator.recentValidations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { ref: 'VAL-2025-0089', outcome: 'approved', time: '1h' },
                  { ref: 'VAL-2025-0087', outcome: 'approved', time: '2h' },
                  { ref: 'VAL-2025-0085', outcome: 'rejected', time: '3h' },
                  { ref: 'VAL-2025-0083', outcome: 'approved', time: '4h' },
                ].map((item) => (
                  <div key={item.ref} className="flex items-center justify-between text-sm">
                    <Link href={`/dossiers/${item.ref}`} className="hover:underline">
                      {item.ref}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.outcome as any} />
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.validator.performanceSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t('dashboard.validator.thisWeek')}</span>
                    <span className="font-medium">42 {t('dashboard.validator.cases')}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t('dashboard.validator.approvalRate')}</span>
                    <span className="font-medium">89%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t('dashboard.validator.avgTime')}</span>
                    <span className="font-medium">12 min</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t('dashboard.validator.accuracy')}</span>
                    <span className="font-medium">96%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}