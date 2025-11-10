import { LegalDocumentPage } from "@/components/section/Legal";
import { getDictionary } from "@/lib/getDictionary";
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang, "terms", "legal");
  return <LegalDocumentPage {...dictionary} />;
}
