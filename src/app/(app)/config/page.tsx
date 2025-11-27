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

const configSections = [
  {
    title: 'Processus',
    description: 'Configurer les processus CEE et leurs exigences documentaires',
    href: '/config/processes',
    icon: Cog,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    stats: () => {
      const active = mockProcesses.filter(p => p.isActive).length;
      const total = mockProcesses.length;
      return `${active} actifs sur ${total}`;
    },
    actions: [
      { label: 'Voir tout', href: '/config/processes' },
      { label: 'Créer', href: '/config/processes/new', icon: Plus },
    ],
  },
  {
    title: 'Règles de validation',
    description: 'Gérer les règles de validation automatique des documents',
    href: '/config/rules',
    icon: CheckSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    stats: () => {
      const active = mockValidationRules.filter(r => r.isActive).length;
      const total = mockValidationRules.length;
      return `${active} actives sur ${total}`;
    },
    actions: [
      { label: 'Voir tout', href: '/config/rules' },
      { label: 'Créer', href: '/config/rules/new', icon: Plus },
    ],
  },
  {
    title: 'Types de documents',
    description: 'Définir les types de documents et leurs schémas de champs',
    href: '/config/document-types',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    stats: () => {
      const system = mockDocumentTypes.filter(d => d.isSystem).length;
      const custom = mockDocumentTypes.filter(d => !d.isSystem).length;
      return `${system} système, ${custom} personnalisés`;
    },
    actions: [
      { label: 'Voir tout', href: '/config/document-types' },
      { label: 'Créer', href: '/config/document-types/new', icon: Plus },
    ],
  },
  {
    title: 'Schémas de champs',
    description: 'Configurer les schémas d\'extraction pour chaque type de document',
    href: '/config/schemas',
    icon: Layers,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    stats: () => {
      const total = mockDocumentTypes.reduce((sum, d) => sum + (d.fieldSchema?.length || 0), 0);
      return `${total} champs configurés`;
    },
    actions: [
      { label: 'Voir tout', href: '/config/schemas' },
    ],
  },
];

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Gérer les processus, règles et paramètres du système
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
                  {section.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
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
                      {action.label}
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
          <CardTitle>Aperçu de la configuration</CardTitle>
          <CardDescription>
            Résumé des éléments configurés dans le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{mockProcesses.length}</p>
              <p className="text-sm text-muted-foreground">Processus</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{mockValidationRules.length}</p>
              <p className="text-sm text-muted-foreground">Règles</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{mockDocumentTypes.length}</p>
              <p className="text-sm text-muted-foreground">Types de documents</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">
                {mockDocumentTypes.reduce((sum, d) => sum + (d.fieldSchema?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Champs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
