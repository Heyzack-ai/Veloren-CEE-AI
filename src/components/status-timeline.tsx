'use client';

import { DossierMilestone } from '@/types/installer';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type StatusTimelineProps = {
  milestones: DossierMilestone[];
};

export function StatusTimeline({ milestones }: StatusTimelineProps) {
  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => {
        const isCompleted = milestone.status === 'completed';
        const isCurrent = milestone.status === 'current';
        const isLast = index === milestones.length - 1;

        return (
          <div key={milestone.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-4 top-8 w-0.5 h-full',
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2',
                isCompleted && 'bg-green-500 border-green-500',
                isCurrent && 'bg-blue-500 border-blue-500',
                !isCompleted && !isCurrent && 'bg-white border-gray-300'
              )}
            >
              {isCompleted && <Check className="h-4 w-4 text-white" />}
              {isCurrent && <Circle className="h-3 w-3 text-white fill-white" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={cn(
                      'font-medium',
                      (isCompleted || isCurrent) && 'text-foreground',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {milestone.name}
                  </p>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </p>
                  )}
                </div>
                {milestone.completedAt && (
                  <p className="text-sm text-muted-foreground">
                    {format(milestone.completedAt, 'PPp', { locale: fr })}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}