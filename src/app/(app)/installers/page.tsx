'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, UserX } from 'lucide-react';
import { mockInstallers } from '@/lib/mock-data/installers';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

type Installer = typeof mockInstallers[0];

export default function InstallersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [rgeStatusFilter, setRgeStatusFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher par nom, SIRET...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'rgeStatus',
      label: 'Statut RGE',
      type: 'select',
      placeholder: 'Tous les statuts RGE',
      value: rgeStatusFilter,
      onChange: setRgeStatusFilter,
      options: [
        { label: 'Tous les statuts RGE', value: '' },
        { label: 'Valide', value: 'valid' },
        { label: 'Expiré', value: 'expired' },
        { label: 'Non vérifié', value: 'not_verified' },
      ],
    },
    {
      id: 'active',
      label: 'Statut',
      type: 'select',
      placeholder: 'Tous',
      value: activeFilter,
      onChange: setActiveFilter,
      options: [
        { label: 'Tous', value: '' },
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
      ],
    },
  ];

  const filteredInstallers = mockInstallers.filter((installer) => {
    if (searchQuery && !installer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !installer.siret.includes(searchQuery) &&
        !installer.contactName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (rgeStatusFilter && installer.rgeStatus !== rgeStatusFilter) {
      return false;
    }
    if (activeFilter) {
      if (activeFilter === 'active' && !installer.active) return false;
      if (activeFilter === 'inactive' && installer.active) return false;
    }
    return true;
  });

  const columns: Column<Installer>[] = [
    {
      key: 'companyName',
      header: 'Entreprise',
      cell: (installer) => (
        <div>
          <div className="font-medium">{installer.companyName}</div>
          <div className="text-sm text-muted-foreground">{installer.siret}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (installer) => (
        <div>
          <div className="text-sm">{installer.contactName}</div>
          <div className="text-xs text-muted-foreground">{installer.contactEmail}</div>
        </div>
      ),
    },
    {
      key: 'rgeStatus',
      header: 'Statut RGE',
      cell: (installer) => {
        const statusConfig = {
          valid: { label: 'Valide', className: 'bg-green-600' },
          expired: { label: 'Expiré', className: 'bg-red-600' },
          not_verified: { label: 'Non vérifié', className: 'bg-gray-600' },
        };
        const config = statusConfig[installer.rgeStatus];
        return (
          <div>
            <Badge className={config.className}>{config.label}</Badge>
            <div className="text-xs text-muted-foreground mt-1">
              Jusqu'au {new Date(installer.rgeValidUntil).toLocaleDateString('fr-FR')}
            </div>
          </div>
        );
      },
    },
    {
      key: 'dossiers',
      header: 'Dossiers',
      cell: (installer) => (
        <div className="text-sm">
          <div className="font-medium">{installer.activeDossiersCount} actifs</div>
          <div className="text-muted-foreground">{installer.totalDossiersCount} total</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (installer) => (
        installer.active ? (
          <Badge variant="default" className="bg-green-600">Actif</Badge>
        ) : (
          <Badge variant="secondary">Inactif</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (installer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/installers/${installer.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dossiers?installer=${installer.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les dossiers
              </Link>
            </DropdownMenuItem>
            {installer.active && (
              <DropdownMenuItem className="text-red-600">
                <UserX className="h-4 w-4 mr-2" />
                Désactiver
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Installateurs</h1>
          <p className="text-muted-foreground">
            {filteredInstallers.length} installateur{filteredInstallers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/installers/new">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un installateur
          </Link>
        </Button>
      </div>

      <FilterBar
        filters={filters}
        onClearAll={() => {
          setSearchQuery('');
          setRgeStatusFilter('');
          setActiveFilter('');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredInstallers}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredInstallers.length / pageSize)}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}