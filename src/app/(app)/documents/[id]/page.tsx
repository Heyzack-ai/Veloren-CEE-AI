'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PDFViewer } from '@/components/pdf-viewer';
import { StatusBadge } from '@/components/status-badge';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { mockDocuments, getDocumentById } from '@/lib/mock-data/documents';
import { mockDossiers } from '@/lib/mock-data/dossiers';
import {
  ArrowLeft,
  Download,
  FileText,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

 type PageProps = {
  params: { id: string };
};

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = params;
  const document = getDocumentById(id);

  if (!document) {
    notFound();
  }

  const dossier = mockDossiers.find((d) => d.reference === document.dossierRef);

  const formatDate = (date: Date) =>
    format(date, 'dd MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/documents" className="hover:text-foreground">
          Documents
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[300px]">
          {document.fileName}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>{document.fileName}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{document.documentType}</span>
              <span>•</span>
              <span>Réf. dossier {document.dossierRef}</span>
              {dossier && (
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-auto text-primary"
                  asChild
                >
                  <Link href={`/dossiers/${dossier.id}`} className="inline-flex items-center gap-1">
                    Voir le dossier
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a
              href={document.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: PDF viewer */}
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
          <PDFViewer url={document.url} className="flex-1" />
        </div>

        {/* Right: metadata */}
        <div className="w-[34%] flex flex-col gap-4">
          {/* Status / confidence */}
          <Card>
            <CardHeader>
              <CardTitle>Statut du document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut de traitement</span>
                <StatusBadge status={document.status} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confiance extraction</span>
                  {document.status === 'completed' ? (
                    <Badge variant="secondary">{document.confidence}%</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
                {document.status === 'completed' && (
                  <ConfidenceIndicator value={document.confidence} />
                )}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date d'upload</span>
                  <span className="font-medium">{formatDate(document.uploadDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Installateur</span>
                  <span className="font-medium truncate max-w-[160px] text-right">
                    {document.installer}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related dossier & actions */}
          <Card>
            <CardHeader>
              <CardTitle>Dossier lié</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {dossier ? (
                <>
                  <div>
                    <p className="text-muted-foreground">Référence dossier</p>
                    <p className="font-medium">{dossier.reference}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bénéficiaire</p>
                    <p className="font-medium">{dossier.beneficiary.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Processus</p>
                    <p className="font-medium">{dossier.processCode}</p>
                    <p className="text-muted-foreground text-xs">{dossier.processName}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/dossiers/${dossier.id}`} className="inline-flex items-center gap-2">
                        Voir le dossier
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/validation/${dossier.id}`} className="inline-flex items-center gap-2">
                        Ouvrir la validation
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Aucun dossier correspondant trouvé pour {document.dossierRef}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
