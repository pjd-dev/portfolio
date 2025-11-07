import { getDictionary } from "@/lib/getDictionary";
import Hero from "@/components/section/Hero";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <Hero {...dictionary.hero} />;
}
