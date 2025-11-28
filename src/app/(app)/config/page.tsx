'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Cog,
  CheckSquare,
  FileText,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { mockProcesses } from '@/lib/mock-data/processes';
import { mockDocumentTypes } from '@/lib/mock-data/document-types';
import { mockValidationRules } from '@/lib/mock-data/validation-rules';
import { useTranslation } from '@/lib/i18n';

export default function ConfigPage() {
  const { t } = useTranslation();

  const configSections = [
    {
      titleKey: 'config.sections.processes.title',
      descriptionKey: 'config.sections.processes.description',
      href: '/config/processes',
      icon: Cog,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      stats: () => {
        const active = mockProcesses.filter(p => p.isActive).length;
        const total = mockProcesses.length;
        return t('config.sections.processes.stats', { active, total });
      },
      actions: [
        { labelKey: 'config.actions.viewAll', href: '/config/processes' },
        { labelKey: 'config.actions.create', href: '/config/processes/new', icon: Plus },
      ],
    },
    {
      titleKey: 'config.sections.rules.title',
      descriptionKey: 'config.sections.rules.description',
      href: '/config/rules',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      stats: () => {
        const active = mockValidationRules.filter(r => r.isActive).length;
        const total = mockValidationRules.length;
        return t('config.sections.rules.stats', { active, total });
      },
      actions: [
        { labelKey: 'config.actions.viewAll', href: '/config/rules' },
        { labelKey: 'config.actions.create', href: '/config/rules/new', icon: Plus },
      ],
    },
    {
      titleKey: 'config.sections.documentTypes.title',
      descriptionKey: 'config.sections.documentTypes.description',
      href: '/config/document-types',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      stats: () => {
        const system = mockDocumentTypes.filter(d => d.isSystem).length;
        const custom = mockDocumentTypes.filter(d => !d.isSystem).length;
        return t('config.sections.documentTypes.stats', { system, custom });
      },
      actions: [
        { labelKey: 'config.actions.viewAll', href: '/config/document-types' },
        { labelKey: 'config.actions.create', href: '/config/document-types/new', icon: Plus },
      ],
    },
    {
      titleKey: 'config.sections.schemas.title',
      descriptionKey: 'config.sections.schemas.description',
      href: '/config/schemas',
      icon: Layers,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      stats: () => {
        const count = mockDocumentTypes.reduce((sum, d) => sum + (d.fieldSchema?.length || 0), 0);
        return t('config.sections.schemas.stats', { count });
      },
      actions: [
        { labelKey: 'config.actions.viewAll', href: '/config/schemas' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">{t('config.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('config.subtitle')}
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {configSections.map((section) => (
          <Card key={section.href} className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${section.bgColor}`}>
                  <section.icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {section.stats()}
                </Badge>
              </div>
              <CardTitle className="mt-4">
                <Link href={section.href} className="hover:underline flex items-center gap-2">
                  {t(section.titleKey)}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </CardTitle>
              <CardDescription>{t(section.descriptionKey)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {section.actions.map((action) => (
                  <Button
                    key={action.href}
                    variant={action.icon ? 'default' : 'outline'}
                    size="sm"
                    asChild
                  >
                    <Link href={action.href}>
                      {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                      {t(action.labelKey)}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t('config.overview.title')}</CardTitle>
          <CardDescription>
            {t('config.overview.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{mockProcesses.length}</p>
              <p className="text-sm text-muted-foreground">{t('config.overview.processes')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{mockValidationRules.length}</p>
              <p className="text-sm text-muted-foreground">{t('config.overview.rules')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{mockDocumentTypes.length}</p>
              <p className="text-sm text-muted-foreground">{t('config.overview.documentTypes')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">
                {mockDocumentTypes.reduce((sum, d) => sum + (d.fieldSchema?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">{t('config.overview.fields')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
