import { getDictionary } from "@/lib/getDictionary";

export default async function Page({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang, "landing");
  console.log(dictionary);
  return null;
  // return <Hero {...dictionary.hero} />;
}
