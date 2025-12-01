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

export default function NewUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Role and permissions
    role: 'validator' as 'administrator' | 'validator' | 'installer',
    
    // Settings
    isActive: true,
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    
    // Notifications
    emailNotifications: true,
    validationAlerts: true,
    systemUpdates: false,
  });

  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Creating user:', formData);
    
    setIsSubmitting(false);
    router.push('/users');
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
            <p className="text-muted-foreground mt-1">
              Créer un nouveau compte utilisateur
            </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Informations de base</CardTitle>
              </div>
              <CardDescription>
                Identité et coordonnées de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
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
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setPasswordError('');
                  }}
                  required
                />
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role and Permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Rôle et permissions</CardTitle>
              </div>
              <CardDescription>
                Définir le niveau d'accès de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'administrator' | 'validator' | 'installer') => 
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrateur</SelectItem>
                    <SelectItem value="validator">Validateur</SelectItem>
                    <SelectItem value="installer">Installateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={currentRole.color}>{currentRole.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentRole.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium">Permissions incluses:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {currentRole.permissions.map((perm) => (
                      <li key={perm} className="flex items-center gap-1">
                        <span className="text-green-600">✓</span> {perm}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compte actif</Label>
                    <p className="text-xs text-muted-foreground">L'utilisateur peut se connecter</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Changement de mot de passe requis</Label>
                    <p className="text-xs text-muted-foreground">À la première connexion</p>
                  </div>
                  <Switch
                    checked={formData.requirePasswordChange}
                    onCheckedChange={(checked) => setFormData({ ...formData, requirePasswordChange: checked })}
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
              <CardDescription>
                Configurer les préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Email de bienvenue</Label>
                    <p className="text-xs text-muted-foreground">Envoyer les identifiants par email</p>
                  </div>
                  <Switch
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) => setFormData({ ...formData, sendWelcomeEmail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Alertes de validation</Label>
                    <p className="text-xs text-muted-foreground">Nouveaux dossiers à valider</p>
                  </div>
                  <Switch
                    checked={formData.validationAlerts}
                    onCheckedChange={(checked) => setFormData({ ...formData, validationAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Mises à jour système</Label>
                    <p className="text-xs text-muted-foreground">Nouvelles fonctionnalités</p>
                  </div>
                  <Switch
                    checked={formData.systemUpdates}
                    onCheckedChange={(checked) => setFormData({ ...formData, systemUpdates: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button (mobile) */}
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
