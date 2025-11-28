'use client';

import { Badge } from '@/components/ui/badge';
import { DossierStatus } from '@/types/dossier';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type StatusBadgeProps = {
  status: DossierStatus | string;
  className?: string;
};

const statusConfig: Record<string, { className: string }> = {
  draft: {
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
  processing: {
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  awaiting_review: {
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  },
  approved: {
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  rejected: {
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
  billed: {
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  },
  paid: {
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  },
  completed: {
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  error: {
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
  pending: {
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  },
  active: {
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  inactive: {
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge className={cn(config.className, className)} variant="secondary">
      {t(`status.${status}`, {}, status)}
    </Badge>
  );
}