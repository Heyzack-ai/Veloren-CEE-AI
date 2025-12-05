'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BulkUploadedFile, BulkUploadStatus } from '@/types/bulk-upload';

type BulkDocumentUploadProps = {
  files: BulkUploadedFile[];
  onFilesSelect: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  isAnalyzing?: boolean;
  disabled?: boolean;
};

export function BulkDocumentUpload({
  files,
  onFilesSelect,
  onFileRemove,
  isAnalyzing = false,
  disabled = false,
}: BulkDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFilesSelect(droppedFiles);
    }
  }, [disabled, onFilesSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onFilesSelect(Array.from(selectedFiles));
    }
    e.target.value = ''; // Reset input
  }, [onFilesSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: BulkUploadStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && !disabled && 'border-muted-foreground/25 hover:border-primary/50 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('bulk-file-input')?.click()}
      >
        <input
          id="bulk-file-input"
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
        />

        {isAnalyzing ? (
          <>
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="font-medium mb-1">Analyse des documents en cours...</p>
            <p className="text-sm text-muted-foreground">
              Classification automatique et détection des opérations CEE
            </p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium mb-1">
              Glissez-déposez vos documents ici
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou cliquez pour parcourir
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Formats acceptés: PDF, JPG, PNG</p>
              <p>Taille maximale par fichier: 10 MB</p>
              <p className="font-medium text-primary">
                Vous pouvez télécharger plusieurs fichiers à la fois
              </p>
            </div>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Fichiers téléchargés ({files.length})</h4>
            </div>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    file.status === 'completed' && 'bg-green-100',
                    file.status === 'uploading' && 'bg-blue-100',
                    file.status === 'error' && 'bg-red-100',
                    file.status === 'pending' && 'bg-muted'
                  )}>
                    {getStatusIcon(file.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file.size)}
                    </p>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-1 h-1" />
                    )}
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  {!isAnalyzing && file.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(file.id);
                      }}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

