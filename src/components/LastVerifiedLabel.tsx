import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LastVerifiedLabelProps {
  className?: string;
}

export function LastVerifiedLabel({ className }: LastVerifiedLabelProps) {
  const { t } = useLanguage();

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="font-semibold text-foreground">{t("common.lastVerified")}:</span>
      <TooltipProvider delayDuration={100} skipDelayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t("common.lastVerifiedTooltip")}
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed" side="top" align="center">
            {t("common.lastVerifiedTooltip")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
