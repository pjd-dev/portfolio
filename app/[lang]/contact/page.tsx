import ContactForm from "@/components/section/form/ContactForm";
import FormShell from "@/components/section/form/FormShell";
import { Wrapper } from "@/components/ui";
import { getDictionary } from "@/lib/getDictionary";
export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang, "contact");

  return (
    <Wrapper id="main-content" role="main">
      <FormShell title={dictionary.title} description={dictionary.description}>
        <ContactForm dictionary={dictionary} />
      </FormShell>
    </Wrapper>
  );
}
