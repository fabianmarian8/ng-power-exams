import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, LANGUAGES, Language } from "@/contexts/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "list";
}

const LanguageSwitcher = ({ variant = "dropdown" }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useLanguage();

  const currentLang = LANGUAGES.find(lang => lang.code === language);

  if (variant === "list") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-3">{t('header.language')}</p>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md transition-colors text-left ${
              language === lang.code
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted/50'
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm">{lang.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">{currentLang?.flag} {currentLang?.code.toUpperCase()}</span>
          <span className="sm:hidden">{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${
              language === lang.code ? 'bg-primary/10 text-primary font-medium' : ''
            }`}
          >
            <span className="mr-2 text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
