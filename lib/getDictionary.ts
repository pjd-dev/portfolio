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


export const getDictionary = async (locale: string, target: string, type ="page") => {
  if (!locale) throw new Error("Language not specified");
  if (!target) throw new Error("Page not specified");
  const getDict = await  import(
    `../app/dictionaries/${locale}/${type}/${target}.json`
  ).then((m) => m.default);
  if (!getDict) {
    throw new Error(
      `No dictionary found for language: ${locale}, type and page: ${target}`,
    );
  }
  return getDict as Promise<Dictionary>;
};
