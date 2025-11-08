import { getDictionary } from "@/lib/getDictionary";
import FormShell from "@/components/form/FormShell";
import ContactForm from "@/components/form/ContactForm";
import { Wrapper } from "@/components/ui";
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
