import "server-only";

const dictionaries = {
  en: () => import("../app/dictionaries/en.json").then((m) => m.default),
  fr: () => import("../app/dictionaries/fr.json").then((m) => m.default),
};

export const getDictionary = async (lang: string) => {
  const getDict = dictionaries[lang as "en" | "fr"] || dictionaries["fr"];
  if (!getDict) {
    throw new Error(`No dictionary found for language: ${lang}`);
  }
  return getDict();
};
