'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/data-table';
import { FilterBar, Filter } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Key, UserX, UserCheck } from 'lucide-react';
import { mockUsers } from '@/lib/mock-data/users';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

type User = typeof mockUsers[0];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Add user dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'validator' as 'administrator' | 'validator' | 'installer',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUser = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Adding user:', newUser);
    setIsSubmitting(false);
    setShowAddDialog(false);
    setNewUser({ name: '', email: '', role: 'validator', password: '' });
    // In real app, would refresh the user list
  };

  const filters: Filter[] = [
    {
      id: 'search',
      label: 'Recherche',
      type: 'search',
      placeholder: 'Rechercher par nom ou email...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'role',
      label: 'Rôle',
      type: 'select',
      placeholder: 'Tous les rôles',
      value: roleFilter,
      onChange: setRoleFilter,
      options: [
        { label: 'Tous les rôles', value: '' },
        { label: 'Administrateur', value: 'administrator' },
        { label: 'Validateur', value: 'validator' },
        { label: 'Installateur', value: 'installer' },
      ],
    },
    {
      id: 'status',
      label: 'Statut',
      type: 'select',
      placeholder: 'Tous les statuts',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Tous les statuts', value: '' },
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
      ],
    },
  ];

  const filteredUsers = mockUsers.filter((user) => {
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (roleFilter && user.role !== roleFilter) {
      return false;
    }
    if (statusFilter) {
      if (statusFilter === 'active' && !user.isActive) return false;
      if (statusFilter === 'inactive' && user.isActive) return false;
    }
    return true;
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nom',
      cell: (user) => (
        <div className="font-medium">{user.name}</div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (user) => (
        <span className="text-muted-foreground">{user.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      cell: (user) => {
        const roleConfig = {
          administrator: { label: 'Administrateur', className: 'bg-purple-600' },
          validator: { label: 'Validateur', className: 'bg-blue-600' },
          installer: { label: 'Installateur', className: 'bg-green-600' },
        };
        const config = roleConfig[user.role];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (user) => (
        user.isActive ? (
          <Badge variant="default" className="bg-green-600">Actif</Badge>
        ) : (
          <Badge variant="secondary">Inactif</Badge>
        )
      ),
    },
    {
      key: 'lastLogin',
      header: 'Dernière connexion',
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="h-4 w-4 mr-2" />
              Réinitialiser le mot de passe
            </DropdownMenuItem>
            {user.isActive ? (
              <DropdownMenuItem className="text-red-600">
                <UserX className="h-4 w-4 mr-2" />
                Désactiver
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <UserCheck className="h-4 w-4 mr-2" />
                Activer
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
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Link>
        </Button>
      </div>

      <FilterBar
        filters={filters}
        onClearAll={() => {
          setSearchQuery('');
          setRoleFilter('');
          setStatusFilter('');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredUsers}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredUsers.length / pageSize)}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Créer un nouveau compte utilisateur pour la plateforme
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                placeholder="Jean Dupont"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: 'administrator' | 'validator' | 'installer') => 
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrateur</SelectItem>
                  <SelectItem value="validator">Validateur</SelectItem>
                  <SelectItem value="installer">Installateur</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newUser.role === 'administrator' && 'Accès complet à toutes les fonctionnalités'}
                {newUser.role === 'validator' && 'Peut valider les dossiers et gérer les documents'}
                {newUser.role === 'installer' && 'Peut soumettre et suivre ses propres dossiers'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe temporaire *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                L'utilisateur devra changer son mot de passe à la première connexion
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddUser} 
              disabled={!newUser.name || !newUser.email || !newUser.password || isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}