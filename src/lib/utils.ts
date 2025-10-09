import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Language } from "@/contexts/LanguageContext";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGE_LOCALES: Record<Language, string> = {
  en: "en-NG",
  pcm: "en-NG",
  ha: "ha-NG",
  yo: "yo-NG",
  ig: "ig-NG"
};

export function formatLocalizedDateTime(dateString: string, language: Language) {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  const locale = LANGUAGE_LOCALES[language] ?? "en-NG";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos"
  }).format(parsedDate);
}
