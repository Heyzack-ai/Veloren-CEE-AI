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
import { ArrowLeft, Save, Building2, User, FileCheck, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { mockInstallers } from '@/lib/mock-data/installers';

type PageProps = {
  params: { id: string };
};

export default function EditInstallerPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const installer = mockInstallers.find(i => i.id === id);

  if (!installer) {
    notFound();
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Company info
    companyName: installer.companyName,
    siret: installer.siret,
    address: installer.address,
    city: installer.city,
    postalCode: installer.postalCode,
    phone: '',
    
    // Contact info
    contactName: installer.contactName,
    contactEmail: installer.contactEmail,
    contactPhone: installer.contactPhone,
    
    // RGE info
    rgeNumber: installer.rgeNumber,
    rgeValidUntil: installer.rgeValidUntil.toISOString().split('T')[0],
    rgeQualifications: installer.qualificationTypes,
    
    // Contract info
    contractReference: installer.contractReference,
    
    // Settings
    active: installer.active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Updating installer:', formData);
    
    setIsSubmitting(false);
    router.push(`/installers/${id}`);
  };

  const rgeQualificationOptions = [
    'Pompes à chaleur',
    'Chaudières',
    'Isolation',
    'Menuiseries',
    'Ventilation',
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link href="/installers" className="hover:text-foreground">Installateurs</Link>
        <span>/</span>
        <Link href={`/installers/${id}`} className="hover:text-foreground">{installer.companyName}</Link>
        <span>/</span>
        <span className="text-foreground">Modifier</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/installers/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold">Modifier l'installateur</h1>
            <p className="text-muted-foreground mt-1">
              {installer.companyName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/installers/${id}`}>Annuler</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Informations entreprise</CardTitle>
              </div>
              <CardDescription>
                Coordonnées et identification de l'entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Raison sociale *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET *</Label>
                <Input
                  id="siret"
                  maxLength={14}
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    maxLength={5}
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Contact principal</CardTitle>
              </div>
              <CardDescription>
                Personne à contacter pour les dossiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nom du contact *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Téléphone direct</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* RGE Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Certification RGE</CardTitle>
              </div>
              <CardDescription>
                Informations sur la qualification RGE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rgeNumber">Numéro RGE</Label>
                <Input
                  id="rgeNumber"
                  value={formData.rgeNumber}
                  onChange={(e) => setFormData({ ...formData, rgeNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rgeValidUntil">Valide jusqu'au</Label>
                <Input
                  id="rgeValidUntil"
                  type="date"
                  value={formData.rgeValidUntil}
                  onChange={(e) => setFormData({ ...formData, rgeValidUntil: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Qualifications</Label>
                <div className="grid grid-cols-2 gap-2">
                  {rgeQualificationOptions.map((qual) => (
                    <label key={qual} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.rgeQualifications.includes(qual)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, rgeQualifications: [...formData.rgeQualifications, qual] });
                          } else {
                            setFormData({ ...formData, rgeQualifications: formData.rgeQualifications.filter(q => q !== qual) });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      {qual}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Statut et paramètres</CardTitle>
              </div>
              <CardDescription>
                Gestion du compte installateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contractReference">Référence contrat</Label>
                <Input
                  id="contractReference"
                  value={formData.contractReference}
                  onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
                />
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="text-base">Compte actif</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.active 
                        ? "L'installateur peut soumettre des dossiers" 
                        : "L'installateur ne peut plus soumettre de dossiers"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
                {!formData.active && (
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ⚠️ La désactivation empêchera l'installateur de soumettre de nouveaux dossiers
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button (mobile) */}
        <div className="lg:hidden flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/installers/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
