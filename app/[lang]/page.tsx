import { SectionRenderer } from "@/components/section";
import { loadPageDictionary } from "@/lib/dictionary";
export default async function Page({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dictionary = await loadPageDictionary({ locale: lang, target: "landing" });
  return <SectionRenderer sections={dictionary.sections} />;
}
