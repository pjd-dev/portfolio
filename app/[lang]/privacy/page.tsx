import { getDictionary } from "@/lib/getDictionary";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang, "privacy", "legal");
  return <LegalDocumentPage {...dictionary} />;
}
