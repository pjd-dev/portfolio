// lib/i18n.ts
export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export function swapLocaleInPath(pathname: string, nextLocale: Locale) {
  const parts = pathname.split("/").filter(Boolean); // ex: ['fr','projects']
  if (parts.length && SUPPORTED_LOCALES.includes(parts[0] as Locale)) {
    parts[0] = nextLocale;
  } else {
    parts.unshift(nextLocale);
  }
  return "/" + parts.join("/");
}
