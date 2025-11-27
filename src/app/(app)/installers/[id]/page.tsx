'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/data-table';
import { mockInstallers } from '@/lib/mock-data/installers';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { StatusBadge } from '@/components/status-badge';
import { ArrowLeft, Edit, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PageProps = {
  params: { id: string };
};

export default function InstallerDetailPage({ params }: PageProps) {
  const { id } = params;
  const installer = mockInstallers.find(i => i.id === id);

  if (!installer) {
    notFound();
  }

  // Get dossiers for this installer
  const installerDossiers = mockDossiers.filter(d => d.installerId === id).slice(0, 10);

  const approvalRate = installer.totalDossiersCount > 0
    ? ((installer.totalDossiersCount - (installer.totalDossiersCount * 0.1)) / installer.totalDossiersCount * 100)
    : 0;

  const columns: Column<typeof installerDossiers[0]>[] = [
    {
      key: 'reference',
      header: 'Référence',
      cell: (dossier) => (
        <Link href={`/dossiers/${dossier.id}`} className="font-medium hover:underline">
          {dossier.reference}
        </Link>
      ),
    },
    {
      key: 'beneficiary',
      header: 'Bénéficiaire',
      cell: (dossier) => <span>{dossier.beneficiary.name}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (dossier) => <StatusBadge status={dossier.status} />,
    },
    {
      key: 'submittedAt',
      header: 'Date',
      cell: (dossier) => (
        <span className="text-sm text-muted-foreground">
          {format(dossier.submittedAt, 'PP', { locale: fr })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link href="/installers" className="hover:text-foreground">Installateurs</Link>
        <span>/</span>
        <span className="text-foreground">{installer.companyName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{installer.companyName}</h1>
          <p className="text-muted-foreground">SIRET: {installer.siret}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/installers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/installers/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Voir le contrat
          </Button>
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom de l'entreprise</p>
              <p className="font-medium">{installer.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SIRET</p>
              <p className="font-medium">{installer.siret}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SIREN</p>
              <p className="font-medium">{installer.siren}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              {installer.active ? (
                <Badge variant="default" className="bg-green-600">Actif</Badge>
              ) : (
                <Badge variant="secondary">Inactif</Badge>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">
                {installer.address}<br />
                {installer.postalCode} {installer.city}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Contact principal</p>
              <p className="font-medium">{installer.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{installer.contactEmail}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium">{installer.contactPhone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Numéro RGE</p>
              <p className="font-medium">{installer.rgeNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valide jusqu'au</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {format(installer.rgeValidUntil, 'PP', { locale: fr })}
                </p>
                {installer.rgeStatus === 'valid' ? (
                  <Badge variant="default" className="bg-green-600">Valide</Badge>
                ) : installer.rgeStatus === 'expired' ? (
                  <Badge variant="destructive">Expiré</Badge>
                ) : (
                  <Badge variant="secondary">Non vérifié</Badge>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-2">Types de qualification</p>
              <div className="flex flex-wrap gap-2">
                {installer.qualificationTypes.map((qual, i) => (
                  <Badge key={i} variant="outline">{qual}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du contrat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Référence du contrat</p>
              <p className="font-medium">{installer.contractReference}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de début</p>
              <p className="font-medium">{format(installer.createdAt, 'PP', { locale: fr })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques des dossiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total soumis</p>
              <p className="text-3xl font-bold">{installer.totalDossiersCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approuvés</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-600">
                  {Math.floor(installer.totalDossiersCount * 0.9)}
                </p>
                <span className="text-sm text-muted-foreground">
                  ({approvalRate.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejetés</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-red-600">
                  {Math.floor(installer.totalDossiersCount * 0.1)}
                </p>
                <span className="text-sm text-muted-foreground">
                  ({(100 - approvalRate).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-3xl font-bold text-yellow-600">
                {installer.activeDossiersCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Dossiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dossiers récents</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dossiers?installer=${id}`}>
                Voir tous les dossiers
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={installerDossiers}
          />
        </CardContent>
      </Card>
    </div>
  );
}