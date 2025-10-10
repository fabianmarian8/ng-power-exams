import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OutageSource } from '@/lib/outages-types';
import { useLanguage } from '@/contexts/LanguageContext';

interface OutagesFilterProps {
  sources: OutageSource[];
  selectedSources: OutageSource[];
  onSourceToggle: (source: OutageSource) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SOURCE_LABELS: Partial<Record<OutageSource, string>> = {
  TCN: 'TCN',
  IKEJA: 'Ikeja',
  EKEDC: 'Eko',
  KADUNA: 'Kaduna',
  JED: 'JED',
  AEDC: 'AEDC',
  IBEDC: 'IBEDC'
};

export function OutagesFilter({
  sources,
  selectedSources,
  onSourceToggle,
  searchQuery,
  onSearchChange
}: OutagesFilterProps) {
  const { t } = useLanguage();
  const [showSourceFilter, setShowSourceFilter] = useState(false);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('outagesBoard.searchPlaceholder', 'Search by area or keyword...')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSourceFilter(!showSourceFilter)}
          className="text-xs"
        >
          {showSourceFilter ? 'Hide' : 'Show'} source filters
        </Button>
        
        {showSourceFilter && (
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <Badge
                key={source}
                variant={selectedSources.includes(source) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onSourceToggle(source)}
              >
                {SOURCE_LABELS[source] ?? source}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
