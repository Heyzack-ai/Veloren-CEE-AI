'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status-badge';
import { PDFViewer } from '@/components/pdf-viewer';
import { DocumentSwitcher } from '@/components/document-switcher';
import { FieldEditor } from '@/components/field-editor';
import { ValidationRulesList } from '@/components/validation-rules-list';
import { useTimer } from '@/hooks/use-timer';
import { useValidationState } from '@/hooks/use-validation-state';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import {
  mockPDFDocuments,
  mockValidationFields,
  mockValidationRulesForDossier,
} from '@/lib/mock-data/validation-fields';
import {
  ArrowLeft,
  Save,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { id: string };
};

export default function ValidationWorkspacePage({ params }: PageProps) {
  const { id } = params;
  const dossier = mockDossiers.find((d) => d.id === id);

  const [activeDocumentId, setActiveDocumentId] = useState(mockPDFDocuments[0].id);
  const [requestDocsDialogOpen, setRequestDocsDialogOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [requestMessage, setRequestMessage] = useState('');
  const { formatTime } = useTimer();

  const {
    fields,
    rules,
    isDirty,
    updateFieldValue,
    markFieldWrong,
    requestRerun,
    save,
  } = useValidationState({
    initialFields: mockValidationFields,
    initialRules: mockValidationRulesForDossier,
  });

  if (!dossier) {
    notFound();
  }

  const activeDocument = mockPDFDocuments.find((doc) => doc.id === activeDocumentId);
  const documentFields = fields.filter((f) => f.documentType === activeDocument?.type);

  const passedCount = rules.filter((r) => r.status === 'passed').length;
  const warningCount = rules.filter((r) => r.status === 'warning').length;
  const errorCount = rules.filter((r) => r.status === 'error').length;

  const handleSaveProgress = async () => {
    await save();
    // Show toast notification
    console.log('Progress saved');
  };

  const handleApprove = () => {
    // Handle approval logic
    console.log('Approving dossier...');
  };

  const handleReject = () => {
    // Handle rejection logic
    console.log('Rejecting dossier...');
  };

  const handleRequestDocuments = () => {
    console.log('Requesting documents:', {
      documents: selectedDocuments,
      message: requestMessage,
    });
    // Send request to installer
    setRequestDocsDialogOpen(false);
    setSelectedDocuments([]);
    setRequestMessage('');
  };

  const toggleDocument = (docType: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docType)
        ? prev.filter(d => d !== docType)
        : [...prev, docType]
    );
  };

  // Get list of document types from the dossier
  const availableDocuments = [
    { type: 'Attestation Honneur', label: 'Attestation sur l\'honneur' },
    { type: 'Devis', label: 'Devis' },
    { type: 'Facture', label: 'Facture' },
    { type: 'Cadre Contribution', label: 'Cadre de contribution' },
    { type: 'Photos', label: 'Photos de l\'installation' },
    { type: 'Champs', label: 'Fiche CHAMPS' },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-4 space-y-3">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dossiers/${id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">Valider le dossier</h1>
                <p className="text-sm text-muted-foreground">
                  {dossier.reference} - {dossier.beneficiary.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSaveProgress} disabled={!isDirty}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={() => setRequestDocsDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Demander documents
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuver le dossier
              </Button>
            </div>
          </div>

          {/* Status Row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Statut:</span>
              <StatusBadge status={dossier.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Confiance:</span>
              <Badge variant="secondary">{dossier.confidence}%</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Problèmes:</span>
              <div className="flex items-center gap-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {errorCount}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                    <AlertTriangle className="h-3 w-3" />
                    {warningCount}
                  </Badge>
                )}
                {errorCount === 0 && warningCount === 0 && (
                  <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Aucun
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - PDF Viewer */}
        <div className="w-[60%] border-r flex flex-col">
          <DocumentSwitcher
            documents={mockPDFDocuments}
            activeDocumentId={activeDocumentId}
            onDocumentChange={setActiveDocumentId}
          />
          {activeDocument && (
            <PDFViewer url={activeDocument.url} className="flex-1" />
          )}
        </div>

        {/* Right Panel - Validation */}
        <div className="w-[40%] flex flex-col overflow-hidden">
          <Tabs defaultValue="fields" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-shrink-0">
              <TabsTrigger
                value="fields"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Champs
              </TabsTrigger>
              <TabsTrigger
                value="validation"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Validation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="flex-1 overflow-y-auto p-4 mt-0">
              <div className="space-y-4 pb-4">
                <h2 className="text-sm font-semibold uppercase text-muted-foreground sticky top-0 bg-background py-2 -mt-2">
                  {activeDocument?.displayName} - CHAMPS
                </h2>
                {documentFields.map((field) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    onValueChange={(value) => updateFieldValue(field.id, value)}
                    onMarkWrong={() => markFieldWrong(field.id)}
                    onRerunCheck={() => requestRerun(field.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="validation" className="flex-1 overflow-y-auto p-4 mt-0">
              <ValidationRulesList rules={rules} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Temps passé: {formatTime()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {passedCount} réussies, {warningCount} avertissements, {errorCount} erreurs
            </span>
          </div>
        </div>
      </div>

      {/* Request Documents Dialog */}
      <Dialog open={requestDocsDialogOpen} onOpenChange={setRequestDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Demander des documents</DialogTitle>
            <DialogDescription>
              Sélectionnez les documents manquants ou incorrects à demander à l'installateur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Document Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Documents à demander</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableDocuments.map((doc) => (
                  <div
                    key={doc.type}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleDocument(doc.type)}
                  >
                    <Checkbox
                      checked={selectedDocuments.includes(doc.type)}
                      onCheckedChange={() => toggleDocument(doc.type)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label className="cursor-pointer font-medium">{doc.label}</Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Message pour l'installateur
                <span className="text-muted-foreground text-sm ml-1">(optionnel)</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Expliquez les corrections nécessaires ou les documents manquants..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Ce message sera envoyé par email à l'installateur avec la liste des documents demandés.
              </p>
            </div>

            {/* Preview */}
            {selectedDocuments.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Documents sélectionnés ({selectedDocuments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDocuments.map((docType) => (
                    <Badge key={docType} variant="secondary" className="bg-blue-100 text-blue-700">
                      {availableDocuments.find(d => d.type === docType)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRequestDocsDialogOpen(false);
                setSelectedDocuments([]);
                setRequestMessage('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRequestDocuments}
              disabled={selectedDocuments.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}