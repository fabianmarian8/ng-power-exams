import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT Abuja',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara'
];

const DISCOS = [
  'EKEDC',
  'Ikeja Electric',
  'AEDC',
  'PHED',
  'IBEDC',
  'JED',
  'KAEDCO',
  'KEDCO',
  'YEDC',
  'BEDC',
  'EEDC'
];

export interface OutageFiltersState {
  state: string;
  disco: string;
  status: string;
  source: string;
  dateRange: string;
}

interface OutageFiltersProps {
  onFilterChange: (filters: OutageFiltersState) => void;
  activeFiltersCount?: number;
}

export function OutageFilters({ onFilterChange, activeFiltersCount = 0 }: OutageFiltersProps) {
  const [filters, setFilters] = useState<OutageFiltersState>({
    state: 'all',
    disco: 'all',
    status: 'all',
    source: 'all',
    dateRange: '7days'
  });

  const updateFilter = (key: keyof OutageFiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: OutageFiltersState = {
      state: 'all',
      disco: 'all',
      status: 'all',
      source: 'all',
      dateRange: '7days'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">State/Region</label>
          <Select value={filters.state} onValueChange={(value) => updateFilter('state', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All states" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {NIGERIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Distribution Company</label>
          <Select value={filters.disco} onValueChange={(value) => updateFilter('disco', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All DisCos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All DisCos</SelectItem>
              {DISCOS.map((disco) => (
                <SelectItem key={disco} value={disco}>
                  {disco}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PLANNED">Planned</SelectItem>
              <SelectItem value="UNPLANNED">Unplanned/Live</SelectItem>
              <SelectItem value="RESTORED">Restored</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Source</label>
          <Select value={filters.source} onValueChange={(value) => updateFilter('source', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="TCN">TCN (Official)</SelectItem>
              <SelectItem value="DISCO">DisCos (Official)</SelectItem>
              <SelectItem value="NERC">NERC (Regulatory)</SelectItem>
              <SelectItem value="MEDIA">Media Reports</SelectItem>
              <SelectItem value="TWITTER">Twitter/X</SelectItem>
              <SelectItem value="TELEGRAM">Telegram</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Time Range</label>
          <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
