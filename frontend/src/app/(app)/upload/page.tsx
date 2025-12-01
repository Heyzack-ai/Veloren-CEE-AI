'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUploadArea } from '@/components/document-upload-area';
import { mockCEEProcesses } from '@/lib/mock-data/processes-detailed';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import { CEEProcess, ProcessCategory, UploadedFile } from '@/types/installer';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Step = 'select_operation' | 'upload_documents' | 'review' | 'confirmation';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for resubmit mode
  const resubmitDossierId = searchParams.get('resubmit');
  const correctionsParam = searchParams.get('corrections');
  const correctionsNeeded = correctionsParam ? decodeURIComponent(correctionsParam).split(',') : [];
  const isResubmitMode = !!resubmitDossierId;
  
  // Get the original dossier if in resubmit mode
  const originalDossier = isResubmitMode ? mockDossiers.find(d => d.id === resubmitDossierId) : null;
  
  const [currentStep, setCurrentStep] = useState<Step>(isResubmitMode ? 'upload_documents' : 'select_operation');
  const [selectedProcess, setSelectedProcess] = useState<CEEProcess | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<ProcessCategory>('all');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [beneficiaryInfo, setBeneficiaryInfo] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    email: '',
    phone: '',
  });
  const [confirmations, setConfirmations] = useState({
    legible: false,
    correct: false,
    understand: false,
  });
  const [newDossierId, setNewDossierId] = useState('');

  // Auto-select process when in resubmit mode
  useEffect(() => {
    if (isResubmitMode && originalDossier) {
      const process = mockCEEProcesses.find(p => p.code === originalDossier.processCode);
      if (process) {
        setSelectedProcess(process);
      }
      // Pre-fill beneficiary info
      setBeneficiaryInfo({
        name: originalDossier.beneficiary.name,
        address: originalDossier.beneficiary.address,
        city: originalDossier.beneficiary.city,
        postalCode: originalDossier.beneficiary.postalCode,
        email: '',
        phone: '',
      });
    }
  }, [isResubmitMode, originalDossier]);

  const steps: { id: Step; label: string }[] = [
    { id: 'select_operation', label: 'Sélectionner l\'opération' },
    { id: 'upload_documents', label: 'Télécharger les documents' },
    { id: 'review', label: 'Vérifier' },
    { id: 'confirmation', label: 'Confirmer' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const filteredProcesses = mockCEEProcesses.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (searchQuery) {
      return (
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleFileSelect = (documentType: string, file: File) => {
    const fileId = `${documentType}-${Date.now()}`;
    setUploadedFiles((prev) => ({
      ...prev,
      [documentType]: {
        id: fileId,
        file,
        documentType,
        status: 'uploading',
        progress: 0,
      },
    }));

    // Simulate upload
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles((prev) => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            status: 'completed',
            progress: 100,
          },
        }));
      } else {
        setUploadedFiles((prev) => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            progress,
          },
        }));
      }
    }, 200);
  };

  const handleFileRemove = (documentType: string) => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[documentType];
      return newFiles;
    });
  };

  const canProceedToUpload = selectedProcess !== null;
  
  // In resubmit mode, only corrections are required; otherwise all required docs
  const requiredDocs = selectedProcess?.requiredDocuments.filter((d) => {
    if (isResubmitMode && correctionsNeeded.length > 0) {
      // In resubmit mode, only documents needing correction are required
      return correctionsNeeded.some(
        c => c.toLowerCase() === d.name.toLowerCase() || c.toLowerCase() === d.type.toLowerCase()
      );
    }
    return d.requirement === 'required';
  }) || [];
  
  const uploadedRequiredCount = requiredDocs.filter((doc) => uploadedFiles[doc.type]?.status === 'completed').length;
  const canProceedToReview = uploadedRequiredCount === requiredDocs.length;
  const canSubmit = confirmations.legible && confirmations.correct && confirmations.understand;

  const handleSubmit = () => {
    // Simulate submission
    const dossierId = `VAL-2025-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    setNewDossierId(dossierId);
    setCurrentStep('confirmation');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center font-medium text-sm',
                  index < currentStepIndex && 'bg-green-500 text-white',
                  index === currentStepIndex && 'bg-primary text-white',
                  index > currentStepIndex && 'bg-muted text-muted-foreground'
                )}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-4',
                  index < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Operation */}
      {currentStep === 'select_operation' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Sélectionner l'opération CEE</h1>
            <p className="text-muted-foreground mt-1">
              Choisissez le type d'opération pour votre dossier
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une opération..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={category} onValueChange={(v) => setCategory(v as ProcessCategory)}>
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="residential">Résidentiel</TabsTrigger>
                <TabsTrigger value="tertiary">Tertiaire</TabsTrigger>
                <TabsTrigger value="industrial">Industriel</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredProcesses.map((process) => (
                <Card
                  key={process.code}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary',
                    selectedProcess?.code === process.code && 'border-primary bg-primary/5'
                  )}
                  onClick={() => setSelectedProcess(process)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{process.code}</Badge>
                          {selectedProcess?.code === process.code && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{process.name}</h3>
                        <p className="text-sm text-muted-foreground">{process.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedProcess && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Documents requis</h3>
                <ul className="space-y-2">
                  {selectedProcess.requiredDocuments.map((doc) => (
                    <li key={doc.type} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.name}</span>
                      {doc.requirement === 'required' && (
                        <Badge variant="destructive" className="text-xs">
                          Requis
                        </Badge>
                      )}
                      {doc.requirement === 'optional' && (
                        <Badge variant="secondary" className="text-xs">
                          Optionnel
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep('upload_documents')}
              disabled={!canProceedToUpload}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Upload Documents */}
      {currentStep === 'upload_documents' && selectedProcess && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">
              {isResubmitMode ? 'Soumettre les documents corrigés' : 'Télécharger les documents'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedProcess.code} - {selectedProcess.name}
            </p>
          </div>

          {/* Resubmit Mode Banner */}
          {isResubmitMode && correctionsNeeded.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">Corrections requises</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Veuillez télécharger à nouveau les documents suivants avec les corrections demandées :
                    </p>
                    <ul className="mt-2 space-y-1">
                      {correctionsNeeded.map((docType) => (
                        <li key={docType} className="text-sm text-yellow-800 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-600" />
                          {docType}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {selectedProcess.requiredDocuments.map((doc) => {
              const needsCorrection = correctionsNeeded.some(
                c => c.toLowerCase() === doc.name.toLowerCase() || c.toLowerCase() === doc.type.toLowerCase()
              );
              
              return (
                <div key={doc.type} className={cn(
                  "space-y-3 p-4 rounded-lg border-2",
                  needsCorrection ? "border-yellow-400 bg-yellow-50" : "border-transparent"
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doc.name}</h3>
                        {needsCorrection && (
                          <Badge className="bg-yellow-600 text-xs">
                            Correction requise
                          </Badge>
                        )}
                        {!needsCorrection && doc.requirement === 'required' && (
                          <Badge variant="destructive" className="text-xs">
                            Requis
                          </Badge>
                        )}
                        {!needsCorrection && doc.requirement === 'optional' && (
                          <Badge variant="secondary" className="text-xs">
                            Optionnel
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    </div>
                  </div>

                  <DocumentUploadArea
                    documentType={doc.type}
                    acceptedFormats={doc.acceptedFormats}
                    maxSize={doc.maxSize}
                    onFileSelect={(file) => handleFileSelect(doc.type, file)}
                    onFileRemove={() => handleFileRemove(doc.type)}
                    uploadedFile={
                      uploadedFiles[doc.type]
                        ? {
                            name: uploadedFiles[doc.type].file.name,
                            size: uploadedFiles[doc.type].file.size,
                            status: uploadedFiles[doc.type].status,
                            progress: uploadedFiles[doc.type].progress,
                          }
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progression</span>
                <span className="text-sm text-muted-foreground">
                  {uploadedRequiredCount} / {requiredDocs.length} documents requis téléchargés
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            {isResubmitMode ? (
              <Button variant="outline" asChild>
                <Link href={`/my-dossiers/${resubmitDossierId}`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour au dossier
                </Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setCurrentStep('select_operation')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            )}
            <Button onClick={() => setCurrentStep('review')} disabled={!canProceedToReview}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 'review' && selectedProcess && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Vérifier les informations</h1>
            <p className="text-muted-foreground mt-1">
              Vérifiez les informations avant de soumettre
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Informations bénéficiaire (optionnel)</h3>
              <p className="text-sm text-muted-foreground">
                Ces informations aident à améliorer la précision de l'extraction automatique
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={beneficiaryInfo.name}
                    onChange={(e) =>
                      setBeneficiaryInfo({ ...beneficiaryInfo, name: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={beneficiaryInfo.email}
                    onChange={(e) =>
                      setBeneficiaryInfo({ ...beneficiaryInfo, email: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={beneficiaryInfo.phone}
                    onChange={(e) =>
                      setBeneficiaryInfo({ ...beneficiaryInfo, phone: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={beneficiaryInfo.address}
                    onChange={(e) =>
                      setBeneficiaryInfo({ ...beneficiaryInfo, address: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={beneficiaryInfo.city}
                    onChange={(e) =>
                      setBeneficiaryInfo({ ...beneficiaryInfo, city: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={beneficiaryInfo.postalCode}
                    onChange={(e) =>
                      setBeneficiaryInfo({ ...beneficiaryInfo, postalCode: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Documents téléchargés</h3>
              <div className="space-y-2">
                {Object.values(uploadedFiles).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedProcess.requiredDocuments.find((d) => d.type === file.documentType)?.name}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Confirmations</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="legible"
                    checked={confirmations.legible}
                    onCheckedChange={(checked) =>
                      setConfirmations({ ...confirmations, legible: checked as boolean })
                    }
                  />
                  <Label htmlFor="legible" className="cursor-pointer">
                    Je confirme que tous les documents sont lisibles
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="correct"
                    checked={confirmations.correct}
                    onCheckedChange={(checked) =>
                      setConfirmations({ ...confirmations, correct: checked as boolean })
                    }
                  />
                  <Label htmlFor="correct" className="cursor-pointer">
                    Je confirme que les informations du bénéficiaire sont correctes
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="understand"
                    checked={confirmations.understand}
                    onCheckedChange={(checked) =>
                      setConfirmations({ ...confirmations, understand: checked as boolean })
                    }
                  />
                  <Label htmlFor="understand" className="cursor-pointer">
                    Je comprends que les documents seront vérifiés
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('upload_documents')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              <Upload className="h-4 w-4 mr-2" />
              Soumettre le dossier
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 'confirmation' && (
        <div className="space-y-6 text-center py-12">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">
              {isResubmitMode ? 'Documents corrigés soumis !' : 'Dossier soumis avec succès !'}
            </h1>
            <p className="text-xl font-semibold text-primary">
              {isResubmitMode ? originalDossier?.reference : newDossierId}
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 space-y-4 text-left">
              <p className="text-muted-foreground">
                {isResubmitMode 
                  ? 'Vos documents corrigés sont en cours de vérification. Vous recevrez une notification lorsque la nouvelle validation sera terminée.'
                  : 'Vos documents sont en cours de traitement. Vous recevrez une notification lorsque la validation sera terminée.'
                }
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Temps de traitement estimé : 24-48 heures
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            {!isResubmitMode && (
              <Button variant="outline" onClick={() => router.push('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Télécharger un autre dossier
              </Button>
            )}
            <Button asChild>
              <Link href="/my-dossiers">Voir mes dossiers</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}