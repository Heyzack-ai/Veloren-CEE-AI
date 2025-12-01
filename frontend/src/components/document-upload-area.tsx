'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type DocumentUploadAreaProps = {
  documentType: string;
  acceptedFormats: string[];
  maxSize: number;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  uploadedFile?: {
    name: string;
    size: number;
    status: 'uploading' | 'completed' | 'error';
    progress: number;
  };
};

export function DocumentUploadArea({
  documentType,
  acceptedFormats,
  maxSize,
  onFileSelect,
  onFileRemove,
  uploadedFile,
}: DocumentUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (uploadedFile) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
              uploadedFile.status === 'completed' && 'bg-green-100',
              uploadedFile.status === 'uploading' && 'bg-blue-100',
              uploadedFile.status === 'error' && 'bg-red-100'
            )}
          >
            {uploadedFile.status === 'completed' && (
              <Check className="h-5 w-5 text-green-600" />
            )}
            {uploadedFile.status === 'uploading' && (
              <File className="h-5 w-5 text-blue-600" />
            )}
            {uploadedFile.status === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{uploadedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(uploadedFile.size)}
            </p>

            {uploadedFile.status === 'uploading' && (
              <Progress value={uploadedFile.progress} className="mt-2" />
            )}

            {uploadedFile.status === 'error' && (
              <p className="text-sm text-red-600 mt-1">
                Erreur lors du téléchargement
              </p>
            )}
          </div>

          {onFileRemove && uploadedFile.status !== 'uploading' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        isDragging && 'border-primary bg-primary/5',
        !isDragging && 'border-muted-foreground/25 hover:border-primary/50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById(`file-input-${documentType}`)?.click()}
    >
      <input
        id={`file-input-${documentType}`}
        type="file"
        className="hidden"
        accept={acceptedFormats.map((f) => `.${f.toLowerCase()}`).join(',')}
        onChange={handleFileInput}
      />

      <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />

      <p className="font-medium mb-1">
        Glissez-déposez votre fichier ici
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        ou cliquez pour parcourir
      </p>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Formats acceptés: {acceptedFormats.join(', ')}</p>
        <p>Taille maximale: {formatFileSize(maxSize)}</p>
      </div>
    </div>
  );
}