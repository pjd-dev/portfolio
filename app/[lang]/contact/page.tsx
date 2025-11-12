import { SectionRenderer } from "@/components/section";
import { getPageDictionary } from "@/lib/getDictionary";
export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getPageDictionary(lang, "contact");
  return <SectionRenderer sections={dictionary.sections} />;
}
