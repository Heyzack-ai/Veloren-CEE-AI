'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/status-badge';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ValidationQueuePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [processFilter, setProcessFilter] = useState('all');
  const [installerFilter, setInstallerFilter] = useState('all');
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  const queueDossiers = mockDossiers
    .filter(d => d.status === 'awaiting_review')
    .filter(d => {
      if (searchQuery) {
        return (
          d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.beneficiary.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter(d => processFilter === 'all' || d.processCode === processFilter)
    .filter(d => installerFilter === 'all' || d.installerId === installerFilter)
    .filter(d => !showPriorityOnly || d.priority === 'high')
    .sort((a, b) => {
      // Sort by priority first, then by wait time
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.submittedAt.getTime() - b.submittedAt.getTime();
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">File de validation</h1>
        <p className="text-muted-foreground mt-1">
          {queueDossiers.length} dossiers en attente de validation
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Référence, bénéficiaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="process">Processus</Label>
              <Select value={processFilter} onValueChange={setProcessFilter}>
                <SelectTrigger id="process" className="mt-1.5">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les processus</SelectItem>
                  <SelectItem value="BAR-TH-171">BAR-TH-171</SelectItem>
                  <SelectItem value="BAR-TH-104">BAR-TH-104</SelectItem>
                  <SelectItem value="BAR-TH-106">BAR-TH-106</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="installer">Installateur</Label>
              <Select value={installerFilter} onValueChange={setInstallerFilter}>
                <SelectTrigger id="installer" className="mt-1.5">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les installateurs</SelectItem>
                  <SelectItem value="inst-1">EcoTherm Solutions</SelectItem>
                  <SelectItem value="inst-2">GreenEnergy Pro</SelectItem>
                  <SelectItem value="inst-3">Rénov'Habitat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Switch
                  id="priority"
                  checked={showPriorityOnly}
                  onCheckedChange={setShowPriorityOnly}
                />
                <Label htmlFor="priority" className="cursor-pointer">
                  Prioritaires uniquement
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {queueDossiers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun dossier en attente</p>
                <p className="text-sm text-muted-foreground">
                  Tous les dossiers ont été validés
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          queueDossiers.map((dossier) => (
            <Card
              key={dossier.id}
              className={`relative overflow-hidden ${
                dossier.priority === 'high'
                  ? 'border-l-4 border-l-red-500'
                  : dossier.priority === 'normal'
                  ? 'border-l-4 border-l-yellow-500'
                  : 'border-l-4 border-l-gray-300'
              }`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-heading font-semibold text-lg">
                        {dossier.reference}
                      </h3>
                      {dossier.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Prioritaire
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dossier.beneficiary.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {dossier.beneficiary.address}, {dossier.beneficiary.city}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Processus</span>
                      <span className="font-medium">{dossier.processCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Installateur</span>
                      <span className="font-medium truncate ml-2">
                        {dossier.installerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">En attente depuis</span>
                      <span className="font-medium">
                        {formatDistanceToNow(dossier.submittedAt, { locale: fr })}
                      </span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Confiance</span>
                      <span className="font-medium">{dossier.confidence}%</span>
                    </div>
                    <ConfidenceIndicator value={dossier.confidence} showPercentage={false} />
                  </div>

                  {/* Action */}
                  <Button asChild className="w-full">
                    <Link href={`/validation/${dossier.id}`}>
                      Ouvrir la validation
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}