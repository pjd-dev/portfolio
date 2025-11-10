import "server-only";
import type { LayoutDictionary } from "./validation/layoutDictionarySchema";
import type { PageDictionary } from "./validation/pageDictionarySchema";

export const getDictionary = async (
  locale: string,
  target: string,
  type = "page",
): Promise<LayoutDictionary | PageDictionary> => {
  if (!locale) throw new Error("Language not specified");
  if (!target) throw new Error("Page not specified");
  const getDict = await import(
    `../app/dictionaries/${locale}/${type}/${target}.json`
  ).then((m) => m.default);
  if (!getDict) {
    throw new Error(
      `No dictionary found for language: ${locale}, type and page: ${target}`,
    );
  }
  if (type === "layout") {
    return getDict as Promise<LayoutDictionary>;
  }
  return getDict as Promise<PageDictionary>;
};

export const getLayoutDictionary = async (
  locale: string,
  target: string,
): Promise<LayoutDictionary> => {
  return getDictionary(locale, target, "layout") as Promise<LayoutDictionary>;
};

export const getPageDictionary = async (
  locale: string,
  target: string,
): Promise<PageDictionary> => {
  return getDictionary(locale, target, "page") as Promise<PageDictionary>;
};
