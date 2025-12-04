'use client';

import { useState, useEffect } from 'react';
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
import { listUsers, createUser, getUser, updateUser, resetPassword } from '@/lib/users-api';
import { useAuth } from '@/lib/auth-context';
import { User } from '@/types/user';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
//import { toast } from "@/components/ui/use-toast";


// Using API-backed User type

export default function UsersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Add user dialog state (kept as in your file)
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'validator' as 'administrator' | 'validator' | 'installer',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User> & { id?: string }>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editApiError, setEditApiError] = useState<string | null>(null);

  // Reset dialog state
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  // New password fields for reset dialog
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  // Action loading states (per-user)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Load users from API with server-side filters
  async function loadUsers() {
    setLoading(true);
    try {
      const role = roleFilter || undefined;
      const active = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const data = await listUsers({ role: role as User['role'] | undefined, active });
      setUsers(data);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Initial and on filter change
  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, roleFilter, statusFilter]);

  const handleAddUser = async () => {
    setIsSubmitting(true);
    try {
      const data = await createUser({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        active: true,
      });
      console.log('create user data', data);
      setShowAddDialog(false);
      // Optionally refresh list:
      await loadUsers();
    } catch (e) {
      console.error('Create user failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Edit flow ----------

  // Open edit dialog and fetch user data
  const handleOpenEdit = async (userId?: string) => {
    if (!userId) return;
    setEditFieldErrors({});
    setEditApiError(null);
    setEditLoading(true);
    try {
      const data = await getUser(userId);
      console.log('users data', data);
      setEditUser({
        id: data.id as string,
        name: data.name,
        email: data.email,
        role: data.role,
        active: data.active,
      });
      setShowEditDialog(true);
    } catch (err: any) {
      console.error('Failed to fetch user for edit', err);
      setEditApiError(err?.response?.data?.message || err?.message || 'Impossible de récupérer l’utilisateur');
    } finally {
      setEditLoading(false);
    }
  };

  // Validate edit payload
  function validateEditUser() {
    const errs: Record<string, string> = {};
    if (!editUser.name || !String(editUser.name).trim()) errs.name = 'Le nom est requis';
    if (!editUser.email || !String(editUser.email).trim()) errs.email = "L'email est requis";
    else {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(String(editUser.email))) errs.email = "L'email n'est pas valide";
    }
    return errs;
  }

  // Submit update
  const handleUpdateUser = async () => {
    setEditApiError(null);
    setEditFieldErrors({});
    const errs = validateEditUser();
    if (Object.keys(errs).length > 0) {
      setEditFieldErrors(errs);
      return;
    }

    if (!editUser.id) {
      setEditApiError('Utilisateur non trouvé');
      return;
    }

    setIsEditSubmitting(true);
    try {
      // Build payload aligned with CreateUserRequest (only allowed fields)
      const payload: any = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        active: Boolean(editUser.active),
      };

      const updated = await updateUser(editUser.id, payload);

      // Update users state with updated record (if backend returned one)
      if (updated && (updated as any).id) {
        setUsers((prev) => prev.map((u) => ((u.id as any) === (updated as any).id ? (updated as User) : u)));
      } else {
        // fallback: optimistic update
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editUser.id
              ? {
                  ...u,
                  name: (editUser.name as string) || u.name,
                  email: (editUser.email as string) || u.email,
                  role: (editUser.role as User['role']) || u.role,
                  active: typeof editUser.active === 'boolean' ? (editUser.active as boolean) : u.active,
                }
              : u
          )
        );
      }

      setShowEditDialog(false);
      setEditUser({});
    } catch (err: any) {
      console.error('Update user failed', err);
      if (err?.response?.data) {
        const data = err.response.data;
        if (data.errors) {
          const mapped: Record<string, string> = {};
          if (Array.isArray(data.errors)) {
            data.errors.forEach((it: any) => {
              if (it.field && it.message) mapped[it.field] = it.message;
            });
          } else {
            Object.entries(data.errors).forEach(([k, v]) => {
              mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
            });
          }
          setEditFieldErrors(mapped);
          setEditApiError(data.message || 'Échec de la mise à jour de l’utilisateur');
        } else if (data.message) {
          setEditApiError(String(data.message));
        } else {
          setEditApiError('Échec de la mise à jour de l’utilisateur');
        }
      } else if (err?.message) {
        setEditApiError(err.message);
      } else {
        setEditApiError('Échec de la mise à jour de l’utilisateur');
      }
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // ---------- Reset password & Activate/Deactivate ----------

  // Open reset confirmation dialog
  const openResetDialog = (user?: User) => {
    if (!user) return;
    setResetTarget(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetPasswordError(null);
    setShowResetDialog(true);
  };

  // Confirm reset (called from dialog) — now validates passwords and passes to API
  const confirmReset = async () => {
    if (!resetTarget?.id) return;
    // client-side validation
    setResetPasswordError(null);
    if (!newPassword) {
      setResetPasswordError('Le nouveau mot de passe est requis');
      return;
    }
    if (newPassword.length < 8) {
      setResetPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    const userId = resetTarget.id;
    setResettingUserId(userId);
    try {
      await resetPassword(userId, newPassword);
      // success - optionally show toast
      alert('Le mot de passe a été réinitialisé avec succès.');
      // optionally refresh list or user
      await loadUsers();
      // clear dialog fields
      setNewPassword('');
      setConfirmNewPassword('');
      setResetPasswordError(null);
      setShowResetDialog(false);
      setResetTarget(null);
    } catch (err: any) {
      console.error('Reset password failed', err);
      const msg = err?.response?.data?.message || err?.message || 'Échec de la réinitialisation du mot de passe';
      setResetPasswordError(msg);
    } finally {
      setResettingUserId(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (!user?.id) return;
    const newActive = !user.active;
    const action = newActive ? 'Activer' : 'Désactiver';
    const ok = window.confirm(`${action} l'utilisateur ${user.name} ?`);
    if (!ok) return;

    setTogglingUserId(user.id);
    try {
      const updated = await updateUser(user.id, { active: newActive });
      if (updated && (updated as any).id) {
        setUsers((prev) => prev.map((u) => ((u.id as any) === (updated as any).id ? (updated as User) : u)));
      } else {
        // fallback
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: newActive } : u)));
      }
      alert(`L'utilisateur a été ${newActive ? 'activé' : 'désactivé'} avec succès.`);
    } catch (err: any) {
      console.error('Toggle active failed', err);
      const msg = err?.response?.data?.message || err?.message || `Échec de ${newActive ? 'l\'activation' : 'la désactivation'}`;
      alert(msg);
    } finally {
      setTogglingUserId(null);
    }
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

  const filteredUsers = users.filter((user) => {
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
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
        } as const;
        const config = roleConfig[user.role];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (user) => (
        user.active ? (
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
            <DropdownMenuItem onClick={() => handleOpenEdit(user.id as string)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openResetDialog(user)}
              disabled={resettingUserId === user.id}
            >
              <Key className="h-4 w-4 mr-2" />
              {resettingUserId === user.id ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </DropdownMenuItem>
            {user.active ? (
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleToggleActive(user)}
                disabled={togglingUserId === user.id}
              >
                <UserX className="h-4 w-4 mr-2" />
                {togglingUserId === user.id ? 'Désactivation...' : 'Désactiver'}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => handleToggleActive(user)}
                disabled={togglingUserId === user.id}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {togglingUserId === user.id ? 'Activation...' : 'Activer'}
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

      {/* Add User Dialog (kept as-is from your file) */}
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

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>Mettre à jour les informations utilisateur</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editLoading ? (
              <div>Chargement...</div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom complet *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Jean Dupont"
                    value={editUser.name ?? ''}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  />
                  {editFieldErrors.name && <p className="text-sm text-red-600 mt-1">{editFieldErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="jean.dupont@example.com"
                    value={editUser.email ?? ''}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  />
                  {editFieldErrors.email && <p className="text-sm text-red-600 mt-1">{editFieldErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle *</Label>
                  <Select
                    value={(editUser.role as any) ?? 'validator'}
                    onValueChange={(value: 'administrator' | 'validator' | 'installer') =>
                      setEditUser({ ...editUser, role: value })
                    }
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrator">Administrateur</SelectItem>
                      <SelectItem value="validator">Validateur</SelectItem>
                      <SelectItem value="installer">Installateur</SelectItem>
                    </SelectContent>
                  </Select>
                  {editFieldErrors.role && <p className="text-sm text-red-600 mt-1">{editFieldErrors.role}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-active">Statut</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant={editUser.active ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setEditUser({ ...editUser, active: true })}
                    >
                      Actif
                    </Button>
                    <Button
                      variant={!editUser.active ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setEditUser({ ...editUser, active: false })}
                    >
                      Inactif
                    </Button>
                  </div>
                </div>
              </>
            )}

            {editApiError && <div className="text-sm text-red-600">{editApiError}</div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isEditSubmitting}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={editLoading || isEditSubmitting || !editUser.name || !editUser.email}
            >
              {isEditSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog
        open={showResetDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowResetDialog(false);
            setResetTarget(null);
            setNewPassword('');
            setConfirmNewPassword('');
            setResetPasswordError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Réinitialiser le mot de passe pour cet utilisateur ? (un email sera envoyé si configuré)
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              {resetTarget ? `Utilisateur : ${resetTarget.name} (${resetTarget.email})` : ''}
            </p>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe *</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setResetPasswordError(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmer le nouveau mot de passe *</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  setResetPasswordError(null);
                }}
              />
            </div>

            {resetPasswordError && <p className="text-sm text-red-600">{resetPasswordError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setResetTarget(null);
                setNewPassword('');
                setConfirmNewPassword('');
                setResetPasswordError(null);
              }}
              disabled={!!resettingUserId}
            >
              Annuler
            </Button>
            <Button onClick={confirmReset} disabled={!!resettingUserId}>
              {resettingUserId ? 'Réinitialisation...' : 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
