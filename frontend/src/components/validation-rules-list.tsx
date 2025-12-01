'use client';

import { ValidationRule } from '@/types/validation';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type ValidationRulesListProps = {
  rules: ValidationRule[];
};

export function ValidationRulesList({ rules }: ValidationRulesListProps) {
  const passedRules = rules.filter((r) => r.status === 'passed');
  const warningRules = rules.filter((r) => r.status === 'warning');
  const errorRules = rules.filter((r) => r.status === 'error');

  const RuleItem = ({ rule }: { rule: ValidationRule }) => {
    const Icon =
      rule.status === 'passed'
        ? CheckCircle
        : rule.status === 'warning'
        ? AlertTriangle
        : XCircle;

    const bgColor =
      rule.status === 'passed'
        ? 'bg-green-50 border-green-200'
        : rule.status === 'warning'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-red-50 border-red-200';

    const iconColor =
      rule.status === 'passed'
        ? 'text-green-600'
        : rule.status === 'warning'
        ? 'text-yellow-600'
        : 'text-red-600';

    return (
      <div className={cn('p-3 rounded-lg border', bgColor)}>
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconColor)} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{rule.name}</p>
            {rule.message && (
              <p className="text-sm text-muted-foreground mt-1">{rule.message}</p>
            )}
            {rule.description && (
              <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
            )}
            {rule.overridden && (
              <Badge variant="secondary" className="mt-2 text-xs">
                Validé manuellement: {rule.overrideReason}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Passed Rules */}
      {passedRules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-sm">RÉUSSIES ({passedRules.length})</h3>
          </div>
          <div className="space-y-2">
            {passedRules.map((rule) => (
              <RuleItem key={rule.id} rule={rule} />
            ))}
          </div>
        </div>
      )}

      {/* Warning Rules */}
      {warningRules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-sm">AVERTISSEMENTS ({warningRules.length})</h3>
          </div>
          <div className="space-y-2">
            {warningRules.map((rule) => (
              <RuleItem key={rule.id} rule={rule} />
            ))}
          </div>
        </div>
      )}

      {/* Error Rules */}
      {errorRules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-sm">ERREURS ({errorRules.length})</h3>
          </div>
          <div className="space-y-2">
            {errorRules.map((rule) => (
              <RuleItem key={rule.id} rule={rule} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}