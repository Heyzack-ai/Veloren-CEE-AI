import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type KPICardProps = {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
};

const variantStyles = {
  default: 'bg-card',
  success: 'bg-green-50 dark:bg-green-950/20',
  warning: 'bg-yellow-50 dark:bg-yellow-950/20',
  danger: 'bg-red-50 dark:bg-red-950/20',
  info: 'bg-blue-50 dark:bg-blue-950/20',
};

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trend === 'down'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-600 dark:text-gray-400';

  return (
    <Card
      className={cn(
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md transition-shadow'
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change !== undefined || changeLabel) && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change !== undefined && (
              <>
                <TrendIcon className={cn('h-3 w-3 mr-1', trendColor)} />
                <span className={trendColor}>
                  {change > 0 ? '+' : ''}
                  {change}%
                </span>
              </>
            )}
            {changeLabel && <span className="ml-1">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}