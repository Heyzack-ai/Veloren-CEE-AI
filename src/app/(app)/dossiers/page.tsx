'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { StatusBadge } from '@/components/status-badge';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { Search, Download, Plus, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Get unique values for filter dropdowns
const uniqueProcesses = Array.from(new Set(mockDossiers.map(d => d.processCode))).sort();
const uniqueInstallers = Array.from(new Map(mockDossiers.map(d => [d.installerId, { id: d.installerId, name: d.installerName }])).values());
const uniqueValidators = Array.from(new Map(mockDossiers.filter(d => d.assignedValidatorId).map(d => [d.assignedValidatorId, { id: d.assignedValidatorId!, name: d.assignedValidatorName! }])).values());

export default function DossiersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [processFilter, setProcessFilter] = useState('all');
  const [installerFilter, setInstallerFilter] = useState('all');
  const [validatorFilter, setValidatorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Update status filter when URL changes
  useEffect(() => {
    const urlStatus = searchParams.get('status') || 'all';
    setStatusFilter(urlStatus);
  }, [searchParams]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, processFilter, installerFilter, validatorFilter]);

  const filteredDossiers = mockDossiers.filter((dossier) => {
    const matchesSearch = 
      dossier.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.beneficiary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.installerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dossier.status === statusFilter;
    const matchesProcess = processFilter === 'all' || dossier.processCode === processFilter;
    const matchesInstaller = installerFilter === 'all' || dossier.installerId === installerFilter;
    const matchesValidator = validatorFilter === 'all' || dossier.assignedValidatorId === validatorFilter;
    
    return matchesSearch && matchesStatus && matchesProcess && matchesInstaller && matchesValidator;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDossiers.length / pageSize));
  const paginatedDossiers = filteredDossiers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const startIndex = filteredDossiers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredDossiers.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dossiers</h1>
          <p className="text-muted-foreground mt-1">
            {filteredDossiers.length} dossiers au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button asChild>
            <Link href="/upload">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence, bénéficiaire, installateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="processing">En traitement</SelectItem>
            <SelectItem value="awaiting_review">En attente</SelectItem>
            <SelectItem value="approved">Approuvé</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
            <SelectItem value="billed">Facturé</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={processFilter} onValueChange={setProcessFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Processus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les processus</SelectItem>
            {uniqueProcesses.map((code) => (
              <SelectItem key={code} value={code}>{code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={installerFilter} onValueChange={setInstallerFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Installateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les installateurs</SelectItem>
            {uniqueInstallers.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={validatorFilter} onValueChange={setValidatorFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Validateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les validateurs</SelectItem>
            {uniqueValidators.map((val) => (
              <SelectItem key={val.id} value={val.id}>{val.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Bénéficiaire</TableHead>
              <TableHead>Processus</TableHead>
              <TableHead>Installateur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Confiance</TableHead>
              <TableHead>Validateur</TableHead>
              <TableHead>Mis à jour</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDossiers.map((dossier) => (
              <TableRow key={dossier.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/dossiers/${dossier.id}`} className="font-medium hover:underline">
                    {dossier.reference}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{dossier.beneficiary.name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {dossier.beneficiary.address}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{dossier.processCode}</div>
                    <div className="text-muted-foreground">{dossier.processName}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/installers/${dossier.installerId}`} className="hover:underline">
                    {dossier.installerName}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={dossier.status} />
                </TableCell>
                <TableCell>
                  <div className="w-32">
                    <ConfidenceIndicator value={dossier.confidence} />
                  </div>
                </TableCell>
                <TableCell>
                  {dossier.assignedValidatorName || (
                    <span className="text-muted-foreground text-sm">Non assigné</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(dossier.updatedAt, { addSuffix: true, locale: fr })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dossiers/${dossier.id}`}>Voir détails</Link>
                      </DropdownMenuItem>
                      {dossier.status === 'awaiting_review' && (
                        <DropdownMenuItem asChild>
                          <Link href={`/validation/${dossier.id}`}>Valider</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Assigner validateur</DropdownMenuItem>
                      <DropdownMenuItem>Marquer prioritaire</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filteredDossiers.length === 0
            ? 'Aucun dossier à afficher'
            : `Affichage de ${startIndex}-${endIndex} sur ${filteredDossiers.length} dossiers`}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Par page</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                const newSize = parseInt(value, 10);
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || filteredDossiers.length === 0}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                currentPage === totalPages || filteredDossiers.length === 0
              }
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}