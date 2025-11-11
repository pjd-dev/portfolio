import { SectionRenderer } from "@/components/section";
import { getPageDictionary } from "@/lib/getDictionary";
export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getPageDictionary(lang, "terms");
  return <SectionRenderer sections={dictionary.sections} />;
}
