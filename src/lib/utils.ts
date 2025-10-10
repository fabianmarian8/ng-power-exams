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

export function formatNewsDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const day = parts.day ?? '';
  const month = parts.month ?? '';
  const year = parts.year ?? '';
  const hour = parts.hour ?? '00';
  const minute = parts.minute ?? '00';
  return `${day} ${month} ${year}, ${hour}:${minute}`.trim();
}
