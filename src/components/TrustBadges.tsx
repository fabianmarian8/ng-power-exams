import { Shield, CheckCircle2, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const OFFICIAL_SOURCES = [
  { name: 'TCN', desc: 'Transmission Company of Nigeria' },
  { name: 'NERC', desc: 'Nigerian Electricity Regulatory Commission' },
  { name: 'JAMB', desc: 'Joint Admissions and Matriculation Board' },
  { name: 'WAEC', desc: 'West African Examinations Council' },
  { name: 'NECO', desc: 'National Examinations Council' },
];

export function TrustBadges() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-5 w-5 text-trust-blue" />
        <span className="font-medium">Verified Official Sources</span>
      </div>
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {OFFICIAL_SOURCES.map((source) => (
            <Tooltip key={source.name}>
              <TooltipTrigger>
                <Badge variant="outline" className="flex items-center gap-1.5 cursor-help">
                  <CheckCircle2 className="h-3 w-3 text-nigeria-green" />
                  {source.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{source.desc}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Award className="h-4 w-4" />
        <span>All data sourced from official government portals</span>
      </div>
    </div>
  );
}
