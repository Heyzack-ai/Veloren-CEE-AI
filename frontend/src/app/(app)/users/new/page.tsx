'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, User, Shield, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ⭐ Import your real API
import { createUser } from '@/lib/users-api';

export default function NewUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',

    role: 'validator' as 'administrator' | 'validator' | 'installer',

    isActive: true,
    sendWelcomeEmail: true,
    requirePasswordChange: true,

    emailNotifications: true,
    validationAlerts: true,
    systemUpdates: false,
  });

  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setApiError(null);

    // 🔐 Password validation
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setPasswordError('');
    setIsSubmitting(true);

    try {
      // ⭐ Real API call
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        active: formData.isActive,
        // requirePasswordChange: formData.requirePasswordChange,
        // Optional: sendWelcomeEmail, notification settings
        // backend will ignore unknown fields if not needed
      });

      // Redirect to users list after success
      router.push('/users');
    } catch (err: any) {
      console.error('User creation failed:', err);

      // Extract readable error message
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Impossible de créer l’utilisateur';

      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleDescriptions = {
    administrator: {
      label: 'Administrateur',
      description: 'Accès complet à toutes les fonctionnalités du système',
      permissions: ['Gestion des utilisateurs', 'Configuration système', 'Validation des dossiers', 'Rapports et analytics', 'Facturation'],
      color: 'bg-purple-600',
    },
    validator: {
      label: 'Validateur',
      description: 'Peut valider les dossiers et gérer les documents',
      permissions: ['Validation des dossiers', 'Gestion des documents', 'Consultation des rapports'],
      color: 'bg-blue-600',
    },
    installer: {
      label: 'Installateur',
      description: 'Peut soumettre et suivre ses propres dossiers',
      permissions: ['Soumission de dossiers', 'Suivi des dossiers', 'Téléchargement de documents'],
      color: 'bg-green-600',
    },
  };

  const currentRole = roleDescriptions[formData.role];

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link href="/users" className="hover:text-foreground">Utilisateurs</Link>
        <span>/</span>
        <span className="text-foreground">Nouveau</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold">Nouvel utilisateur</h1>
            <p className="text-muted-foreground mt-1">Créer un nouveau compte utilisateur</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/users">Annuler</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
          </Button>
        </div>
      </div>

      {/* ⚠️ Show API errors */}
      {apiError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Informations de base</CardTitle>
              </div>
              <CardDescription>Identité et coordonnées de l'utilisateur</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Adresse email *</Label>
                <Input
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPasswordError('');
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Confirmer le mot de passe *</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setPasswordError('');
                  }}
                  required
                />
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Role + Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Rôle et permissions</CardTitle>
              </div>
              <CardDescription>Définir le niveau d'accès</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrateur</SelectItem>
                    <SelectItem value="validator">Validateur</SelectItem>
                    <SelectItem value="installer">Installateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <Badge className={currentRole.color}>{currentRole.label}</Badge>
                <p className="text-sm text-muted-foreground">{currentRole.description}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {currentRole.permissions.map((perm) => (
                    <li key={perm}>✓ {perm}</li>
                  ))}
                </ul>
              </div>

              {/* Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compte actif</Label>
                    <p className="text-xs text-muted-foreground">L'utilisateur peut se connecter</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Changement de mot de passe requis</Label>
                    <p className="text-xs text-muted-foreground">À la première connexion</p>
                  </div>
                  <Switch
                    checked={formData.requirePasswordChange}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requirePasswordChange: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Configurer les préférences utilisateur</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Email de bienvenue</Label>
                    <p className="text-xs text-muted-foreground">Envoyer les identifiants</p>
                  </div>
                  <Switch
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, sendWelcomeEmail: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Alertes de validation</Label>
                    <p className="text-xs text-muted-foreground">Nouveaux dossiers</p>
                  </div>
                  <Switch
                    checked={formData.validationAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, validationAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Mises à jour système</Label>
                    <p className="text-xs text-muted-foreground">Nouvelles fonctionnalités</p>
                  </div>
                  <Switch
                    checked={formData.systemUpdates}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, systemUpdates: checked })
                    }
                  />
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/users">Annuler</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
          </Button>
        </div>

      </form>
    </div>
  );
}
