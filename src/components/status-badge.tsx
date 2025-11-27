import { Badge } from '@/components/ui/badge';
import { DossierStatus } from '@/types/dossier';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: DossierStatus | string;
  className?: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
  processing: {
    label: 'En traitement',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  awaiting_review: {
    label: 'En attente',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  },
  approved: {
    label: 'Approuvé',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  rejected: {
    label: 'Rejeté',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
  billed: {
    label: 'Facturé',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  },
  paid: {
    label: 'Payé',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  },
  completed: {
    label: 'Terminé',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  error: {
    label: 'Erreur',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
  pending: {
    label: 'En attente',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  },
  active: {
    label: 'Actif',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  inactive: {
    label: 'Inactif',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge className={cn(config.className, className)} variant="secondary">
      {config.label}
    </Badge>
  );
}