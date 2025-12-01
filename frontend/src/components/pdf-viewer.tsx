'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type PDFViewerProps = {
  url: string;
  className?: string;
};

const zoomLevels = [50, 75, 100, 125, 150, 200];

// Simple PDF viewer using iframe - more reliable in Next.js
export function PDFViewer({ url, className }: PDFViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useIframe, setUseIframe] = useState(true);

  const zoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={zoom === zoomLevels[0]}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Select
            value={zoom.toString()}
            onValueChange={(value) => setZoom(Number(value))}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zoomLevels.map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  {level}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={zoom === zoomLevels[zoomLevels.length - 1]}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Document PDF</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF Viewer using iframe */}
      <div className="flex-1 overflow-hidden bg-muted/30">
        <iframe
          src={`${url}#zoom=${zoom}&toolbar=0&navpanes=0`}
          className="w-full h-full border-0"
          title="PDF Viewer"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', width: `${10000 / zoom}%`, height: `${10000 / zoom}%` }}
        />
      </div>
    </div>
  );
}