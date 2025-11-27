'use client';

import { useRef } from 'react';
import { PDFDocument } from '@/types/validation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type DocumentSwitcherProps = {
  documents: PDFDocument[];
  activeDocumentId: string;
  onDocumentChange: (documentId: string) => void;
};

export function DocumentSwitcher({
  documents,
  activeDocumentId,
  onDocumentChange,
}: DocumentSwitcherProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative flex items-center border-b bg-muted/30">
      {/* Left scroll button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 z-10 h-full rounded-none bg-gradient-to-r from-muted/80 to-transparent hover:from-muted"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable tabs container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide px-10 py-1 gap-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onDocumentChange(doc.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md whitespace-nowrap transition-colors flex-shrink-0',
              activeDocumentId === doc.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted border',
              doc.processingStatus === 'failed' && 'text-red-600'
            )}
          >
            <span className="font-medium">{doc.displayName}</span>
            {doc.confidence !== undefined && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  activeDocumentId === doc.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : doc.confidence >= 90
                    ? 'bg-green-100 text-green-700'
                    : doc.confidence >= 70
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                {doc.confidence}%
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 z-10 h-full rounded-none bg-gradient-to-l from-muted/80 to-transparent hover:from-muted"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}