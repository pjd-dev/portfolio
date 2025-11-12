import { getDictionary } from "@/lib/getDictionary";
export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang, "contact");

  return null;
}
