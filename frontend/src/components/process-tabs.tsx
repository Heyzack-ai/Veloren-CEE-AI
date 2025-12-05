'use client';

import { DossierProcess } from '@/types/dossier';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';

interface ProcessTabsProps {
  processes: DossierProcess[];
  activeProcessId: string;
  onProcessChange: (processId: string) => void;
  className?: string;
}

export function ProcessTabs({ 
  processes, 
  activeProcessId, 
  onProcessChange,
  className 
}: ProcessTabsProps) {
  if (processes.length <= 1) {
    return null;
  }

  return (
    <div className={cn("bg-muted/30 border-b", className)}>
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        <span className="text-sm font-medium text-muted-foreground mr-2 whitespace-nowrap">
          Processus CEE:
        </span>
        {processes.map((process, index) => {
          const isActive = process.id === activeProcessId;
          return (
            <button
              key={process.id}
              onClick={() => onProcessChange(process.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                "border",
                isActive
                  ? "bg-background border-primary text-foreground shadow-sm"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {index + 1}
              </span>
              <span className="max-w-[200px] truncate" title={process.processName}>
                {process.processCode}
              </span>
              <StatusBadge status={process.status} className="scale-90" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

