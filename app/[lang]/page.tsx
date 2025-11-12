import { SectionRenderer } from "@/components/section";
import { getPageDictionary } from "@/lib/getDictionary";
export default async function Page({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dictionary = await getPageDictionary(lang, "landing");
  return <SectionRenderer sections={dictionary.sections} />;
}
