'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

export type FilterOption = {
  label: string;
  value: string;
};

export type Filter = {
  id: string;
  label: string;
  type: 'search' | 'select' | 'date';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options?: FilterOption[];
};

type FilterBarProps = {
  filters: Filter[];
  onClearAll?: () => void;
};

export function FilterBar({ filters, onClearAll }: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => f.value !== '');

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
      {filters.map((filter) => (
        <div key={filter.id} className="flex-1 min-w-[200px] max-w-[300px]">
          {filter.type === 'search' && (
            <Input
              placeholder={filter.placeholder || 'Rechercher...'}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="bg-background"
            />
          )}
          {filter.type === 'select' && filter.options && (
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={filter.placeholder || 'Sélectionner...'} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value || '_all_'}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      {hasActiveFilters && onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          <X className="h-4 w-4 mr-2" />
          Effacer les filtres
        </Button>
      )}
    </div>
  );
}
