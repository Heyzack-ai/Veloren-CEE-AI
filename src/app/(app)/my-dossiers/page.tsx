'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { Dossier } from '@/types/dossier';
import { Search, Eye, Upload } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MyDossiersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter dossiers
  const filteredDossiers = mockDossiers
    .filter((d) => {
      if (searchQuery) {
        return (
          d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.beneficiary.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter((d) => statusFilter === 'all' || d.status === statusFilter)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const totalPages = Math.ceil(filteredDossiers.length / pageSize);
  const paginatedDossiers = filteredDossiers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<Dossier>[] = [
    {
      key: 'reference',
      header: 'Référence',
      cell: (dossier) => (
        <Link
          href={`/my-dossiers/${dossier.id}`}
          className="font-medium hover:underline"
        >
          {dossier.reference}
        </Link>
      ),
    },
    {
      key: 'beneficiary',
      header: 'Bénéficiaire',
      cell: (dossier) => (
        <div>
          <p className="font-medium">{dossier.beneficiary.name}</p>
          <p className="text-sm text-muted-foreground">
            {dossier.beneficiary.city}
          </p>
        </div>
      ),
    },
    {
      key: 'process',
      header: 'Opération',
      cell: (dossier) => (
        <div>
          <p className="font-medium">{dossier.processCode}</p>
          <p className="text-sm text-muted-foreground">{dossier.processName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (dossier) => <StatusBadge status={dossier.status} />,
    },
    {
      key: 'submittedAt',
      header: 'Date de soumission',
      cell: (dossier) => (
        <span className="text-sm">
          {format(dossier.submittedAt, 'PPP', { locale: fr })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (dossier) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/my-dossiers/${dossier.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Mes dossiers</h1>
          <p className="text-muted-foreground mt-1">
            {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Upload className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
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
          <Label htmlFor="status">Statut</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="processing">En traitement</SelectItem>
              <SelectItem value="awaiting_review">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedDossiers}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}