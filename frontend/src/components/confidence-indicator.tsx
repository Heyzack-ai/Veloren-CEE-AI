import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ConfidenceIndicatorProps = {
  value: number;
  showPercentage?: boolean;
  className?: string;
};

export function ConfidenceIndicator({ 
  value, 
  showPercentage = true,
  className 
}: ConfidenceIndicatorProps) {
  const getColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', getColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm font-medium text-muted-foreground min-w-[3ch]">
          {value}%
        </span>
      )}
    </div>
  );
}