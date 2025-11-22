"server-only";
import {
  layoutDictionarySchema,
  type LayoutDictionary,
} from "./validation/layoutDictionarySchema";
import {
  pageDictionarySchema,
  type PageDictionary,
  type Sections,
} from "./validation/pageDictionarySchema";

type DictionaryType = "layout" | "page";
type LoadPageOrLayoutDictionaryOptions = {
  locale: string;
  target: string;
};
type GetDictionaryResult = LayoutDictionary | PageDictionary;

type LoadDictionary = LoadPageOrLayoutDictionaryOptions & {
  type?: DictionaryType;
};

type GetSectionOptions = LoadPageOrLayoutDictionaryOptions & {
  sectionId: string;
};

function normalizeTarget(target: string): string {
  const trimmed = target.replace(/^\/+/, "");
  if (!trimmed) {
    // Adjust if your home page dictionary file has a different name
    return "landing";
  }
  return trimmed;
}

export const getDictionary = async ({
  locale,
  target,
  type = "page",
}: LoadDictionary): Promise<GetDictionaryResult> => {
  if (!locale) throw new Error("Language not specified");
  if (!target) throw new Error("Page not specified");

  const slug = normalizeTarget(target);

  try {
    const rawDict = (await import(
      `../app/dictionaries/${locale}/${type}/${slug}.json`
    ).then((m) => m.default)) as unknown;
    if (!rawDict) {
      throw new Error(
        `No dictionary found for language: ${locale}, type and page: ${target}`,
      );
    }
    if (type === "layout") {
      return layoutDictionarySchema.parse(rawDict);
    }
    return pageDictionarySchema.parse(rawDict);
  } catch (err) {
    console.error("getDictionary error", { locale, target, type, err });
    throw new Error(
      `Failed to load ${type} dictionary for language: ${locale}, page: ${target}`,
    );
  }
};

export const loadLayoutDictionary = async ({
  locale,
  target,
}: LoadPageOrLayoutDictionaryOptions): Promise<LayoutDictionary> => {
  return getDictionary({ locale, target, type: "layout" }) as Promise<LayoutDictionary>;
};

export const loadPageDictionary = async ({
  locale,
  target,
}: LoadPageOrLayoutDictionaryOptions): Promise<PageDictionary> => {
  return getDictionary({ locale, target }) as Promise<PageDictionary>;
};

export async function getSectionById(opts: GetSectionOptions): Promise<Sections | null> {
  const dict = await loadPageDictionary(opts);
  const section = dict.sections.find((s) => s.id === opts.sectionId) ?? null;

  return section;
}
