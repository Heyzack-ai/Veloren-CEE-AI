'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkDocumentUpload } from '@/components/bulk-document-upload';
import { quickScanDocuments, getAllCEEProcesses, submitDossier } from '@/lib/mock-data/document-analysis';
import {
  ChevronRight,
  Check,
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  Info,
  Search,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  BulkUploadedFile,
  BulkUploadStep,
  DetectedDocument,
  DetectedProcess,
} from '@/types/bulk-upload';

type Step = BulkUploadStep;

export default function UploadPage() {
  // Simplified flow state
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<BulkUploadedFile[]>([]);
  const [detectedDocuments, setDetectedDocuments] = useState<DetectedDocument[]>([]);
  const [detectedProcesses, setDetectedProcesses] = useState<DetectedProcess[]>([]);
  const [selectedProcessCodes, setSelectedProcessCodes] = useState<string[]>([]);
  const [showProcessSearch, setShowProcessSearch] = useState(false);
  const [processSearchQuery, setProcessSearchQuery] = useState('');
  const [allProcesses, setAllProcesses] = useState<DetectedProcess[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('');
  const [newDossierId, setNewDossierId] = useState('');

  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Télécharger' },
    { id: 'review', label: 'Confirmer' },
    { id: 'confirmation', label: 'Soumis' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Load all processes for search
  useEffect(() => {
    setAllProcesses(getAllCEEProcesses());
  }, []);

  // Quick scan when files complete uploading
  useEffect(() => {
    const completedFiles = uploadedFiles.filter((f) => f.status === 'completed');
    if (completedFiles.length > 0) {
      const { detectedDocuments: docs, detectedProcesses: procs } = quickScanDocuments(uploadedFiles);
      setDetectedDocuments(docs);
      setDetectedProcesses(procs);
      // Auto-select detected processes
      setSelectedProcessCodes(procs.map((p) => p.code));
    }
  }, [uploadedFiles]);

  // Handle multiple file selection
  const handleFilesSelect = useCallback((files: File[]) => {
    const newFiles: BulkUploadedFile[] = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload for each file
    newFiles.forEach((uploadFile) => {
      simulateFileUpload(uploadFile.id);
    });
  }, []);

  // Simulate file upload with progress
  const simulateFileUpload = (fileId: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'uploading' as const, progress: 0 } : f
      )
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'completed' as const, progress: 100 } : f
          )
        );
      } else {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
        );
      }
    }, 150);
  };

  // Handle file removal
  const handleFileRemove = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Toggle process selection
  const toggleProcessSelection = (code: string) => {
    setSelectedProcessCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Add a process from search
  const addProcess = (process: DetectedProcess) => {
    if (!selectedProcessCodes.includes(process.code)) {
      setSelectedProcessCodes((prev) => [...prev, process.code]);
      if (!detectedProcesses.find((p) => p.code === process.code)) {
        setDetectedProcesses((prev) => [...prev, { ...process, fromAttestation: false }]);
      }
    }
    setShowProcessSearch(false);
    setProcessSearchQuery('');
  };

  // Filter processes for search
  const filteredProcesses = allProcesses.filter(
    (p) =>
      !selectedProcessCodes.includes(p.code) &&
      (p.code.toLowerCase().includes(processSearchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(processSearchQuery.toLowerCase()))
  );

  const completedFilesCount = uploadedFiles.filter((f) => f.status === 'completed').length;
  // Process selection is optional - backend will detect processes automatically from attestation
  const canSubmit = completedFilesCount > 0 && !isSubmitting;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitDossier(uploadedFiles, selectedProcessCodes, {
        email: beneficiaryEmail || undefined,
      });
      setNewDossierId(result.dossierId);
      setCurrentStep('confirmation');
    } finally {
      setIsSubmitting(false);
    }
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
                  'text-sm font-medium hidden sm:inline',
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

      {/* Step 1: Upload Documents */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Télécharger vos documents</h1>
            <p className="text-muted-foreground mt-1">
              Déposez tous vos documents. Nous détecterons automatiquement les opérations CEE
              à partir de l'Attestation sur l'honneur.
            </p>
          </div>

          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900">Téléchargement simplifié</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Vous pouvez télécharger un PDF contenant plusieurs documents.
                    L'analyse complète se fait en arrière-plan après soumission.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <BulkDocumentUpload
            files={uploadedFiles}
            onFilesSelect={handleFilesSelect}
            onFileRemove={handleFileRemove}
            isAnalyzing={false}
            disabled={false}
          />

          {/* Quick Document Detection Results */}
          {detectedDocuments.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Documents détectés ({detectedDocuments.length})</h3>
                <div className="space-y-2">
                  {detectedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.originalFileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.classificationLabel}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.confidence >= 0.8 ? 'default' : 'secondary'}>
                        {Math.round(doc.confidence * 100)}% confiance
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detected Processes from Attestation */}
          {detectedProcesses.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Opérations CEE détectées ({detectedProcesses.length})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Détectées depuis l'Attestation sur l'honneur
                  </p>
                </div>
                <div className="space-y-2">
                  {detectedProcesses.map((process) => (
                    <div
                      key={process.code}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                        selectedProcessCodes.includes(process.code)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      )}
                      onClick={() => toggleProcessSelection(process.code)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedProcessCodes.includes(process.code)}
                          onCheckedChange={() => toggleProcessSelection(process.code)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{process.code}</Badge>
                            <span className="font-medium">{process.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {process.description}
                          </p>
                        </div>
                      </div>
                      {process.fromAttestation && (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                          Détecté
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add More Processes (Optional) */}
          <Card>
            <CardContent className="p-4">
              {!showProcessSearch ? (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowProcessSearch(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une autre opération CEE (optionnel)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Les opérations seront détectées automatiquement si non spécifiées
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par code ou nom (ex: BAR-TH-171, pompe à chaleur...)"
                      value={processSearchQuery}
                      onChange={(e) => setProcessSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" onClick={() => {
                      setShowProcessSearch(false);
                      setProcessSearchQuery('');
                    }}>
                      Annuler
                    </Button>
                  </div>
                  {processSearchQuery && (
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredProcesses.slice(0, 10).map((process) => (
                        <div
                          key={process.code}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                          onClick={() => addProcess(process)}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{process.code}</Badge>
                              <span className="text-sm">{process.name}</span>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                      {filteredProcesses.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">
                          Aucune opération trouvée
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email for notifications */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="email" className="whitespace-nowrap">Email (pour notifications)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={beneficiaryEmail}
                  onChange={(e) => setBeneficiaryEmail(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Vous recevrez un email si des documents sont manquants après l'analyse.
              </p>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep('review')}
              disabled={!canSubmit}
              size="lg"
            >
              Confirmer et soumettre
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review and Submit */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Confirmer la soumission</h1>
            <p className="text-muted-foreground mt-1">
              Vérifiez les informations avant de soumettre
            </p>
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Récapitulatif</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Documents téléchargés</span>
                  <span className="font-medium">{completedFilesCount} fichier(s)</span>
                </div>

                <div className="py-2 border-b">
                  <span className="text-muted-foreground">Opérations CEE</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProcessCodes.length > 0 ? (
                      selectedProcessCodes.map((code) => {
                        const process = detectedProcesses.find((p) => p.code === code) ||
                          allProcesses.find((p) => p.code === code);
                        return (
                          <Badge key={code} variant="secondary">
                            {code} - {process?.name || 'Inconnu'}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Détection automatique depuis l'Attestation sur l'honneur
                      </span>
                    )}
                  </div>
                </div>

                {beneficiaryEmail && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Email de notification</span>
                    <span className="font-medium">{beneficiaryEmail}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info about background processing */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900">Traitement en arrière-plan</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Après soumission, notre système analysera vos documents en détail.
                    Si des documents sont manquants ou incomplets, vous recevrez un email
                    vous invitant à les compléter.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
              Retour
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Soumission en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Soumettre le dossier
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 'confirmation' && (
        <div className="space-y-6 text-center py-12">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">
              Dossier soumis avec succès !
            </h1>
            <p className="text-xl font-semibold text-primary">
              {newDossierId}
            </p>
          </div>

          <Card className="max-w-lg mx-auto">
            <CardContent className="p-6 space-y-4 text-left">
              <p className="text-muted-foreground">
                Vos documents sont maintenant en cours de traitement. Notre système va :
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Analyser et classer tous vos documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Vérifier que tous les documents requis sont présents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Vous envoyer un email en cas de documents manquants</span>
                </li>
              </ul>
              <div className="flex items-center gap-2 text-sm pt-2 border-t">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Temps de traitement : quelques minutes à 24 heures
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => {
              setCurrentStep('upload');
              setUploadedFiles([]);
              setDetectedDocuments([]);
              setDetectedProcesses([]);
              setSelectedProcessCodes([]);
              setBeneficiaryEmail('');
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Button>
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