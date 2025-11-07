import "server-only";
import type { SiteFooterProps } from "@/components/layout";
import type { LegalDocumentPageProps } from "@/components/legal/LegalDocumentPage";
import type { HeroProps } from "@/components/section/Hero";
type Dictionary = {
  hero: HeroProps;
  layout: {
    footer: SiteFooterProps;
  };
  privacy: LegalDocumentPageProps;
  terms: LegalDocumentPageProps;
};
const dictionaries = {
  en: () => import("../app/dictionaries/en.json").then((m) => m.default),
  fr: () => import("../app/dictionaries/fr.json").then((m) => m.default),
};

export const getDictionary = async (lang: string) => {
  const getDict = dictionaries[lang as "en" | "fr"] || dictionaries["fr"];
  if (!getDict) {
    throw new Error(`No dictionary found for language: ${lang}`);
  }
  return getDict() as Promise<Dictionary>;
};
