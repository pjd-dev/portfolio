import { SectionRenderer } from "@/components/section";
import { getPageDictionary } from "@/lib/getDictionary";
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getPageDictionary(lang, "privacy");
  return <SectionRenderer sections={dictionary.sections} />;
}
