import { SectionRenderer } from "@/components/section";
import { loadPageDictionary } from "@/lib/dictionary";
type PageParams = {
  lang: Locale;
  slug: string;
};
export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { lang, slug } = await params;
  const dictionary = await loadPageDictionary({ locale: lang, target: slug });
  return <SectionRenderer sections={dictionary.sections} />;
}
