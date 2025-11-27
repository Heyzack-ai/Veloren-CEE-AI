'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  const [autoApproveThreshold, setAutoApproveThreshold] = useState([90]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérer les paramètres de l'application
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="processing">Traitement</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Paramètres de base de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Nom de l'application</Label>
                <Input id="appName" defaultValue="Système de validation CEE" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <Input id="logo" type="file" accept="image/*" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Couleur principale</Label>
                <Input id="primaryColor" type="color" defaultValue="#3b82f6" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Langue par défaut</Label>
                <Select defaultValue="fr">
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select defaultValue="Europe/Paris">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications par email</CardTitle>
              <CardDescription>
                Configurer les notifications envoyées par email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dossier soumis</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifier les validateurs lors de la soumission d'un dossier
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dossier approuvé</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifier les installateurs lors de l'approbation
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dossier rejeté</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifier les installateurs lors du rejet
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Correction demandée</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifier lors d'une demande de correction
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rappel de paiement</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer des rappels de paiement automatiques
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Résumé quotidien</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un résumé quotidien aux administrateurs
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de traitement</CardTitle>
              <CardDescription>
                Configurer le traitement automatique des dossiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Seuil de confiance par défaut</Label>
                  <p className="text-sm text-muted-foreground">
                    Niveau de confiance minimum pour l'extraction automatique
                  </p>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={autoApproveThreshold}
                      onValueChange={setAutoApproveThreshold}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-medium">
                      {autoApproveThreshold[0]}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="queuePriority">Règles de priorité de la file</Label>
                <Textarea
                  id="queuePriority"
                  placeholder="Définir les règles de priorité..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retrySettings">Paramètres de nouvelle tentative</Label>
                <Input
                  id="retrySettings"
                  type="number"
                  defaultValue="3"
                  placeholder="Nombre de tentatives"
                />
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intégrations externes</CardTitle>
              <CardDescription>
                Configurer les services externes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geminiKey">Clé API Gemini</Label>
                <Input
                  id="geminiKey"
                  type="password"
                  placeholder="••••••••••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageEndpoint">Point de terminaison de stockage (MinIO)</Label>
                <Input
                  id="storageEndpoint"
                  placeholder="https://storage.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpServer">Serveur SMTP</Label>
                <Input
                  id="smtpServer"
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL Webhook</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>
                Gérer les paramètres de sécurité de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  defaultValue="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordLength">Longueur minimale du mot de passe</Label>
                <Input
                  id="passwordLength"
                  type="number"
                  defaultValue="8"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Exiger 2FA pour tous les utilisateurs
                  </p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipAllowlist">Liste blanche IP</Label>
                <Textarea
                  id="ipAllowlist"
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                  rows={4}
                />
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}