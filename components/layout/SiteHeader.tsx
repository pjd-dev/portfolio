import { HeaderRoot, HeaderLogo, HeaderHomeLink } from "../ui";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
type SiteHeaderProps = {
  // dictionary: FooterDictionary;
  lang: Locale;
  // copyright: string;
};

export function SiteHeader({ lang }: SiteHeaderProps) {
  return (
    <HeaderRoot aria-hidden="false" role="banner">
      <HeaderHomeLink
        className="glassButton"
        href={`/${lang}`}
        aria-label="Darrybook Home"
        hrefLang={lang}
        prefetch
      >
        <HeaderLogo />
      </HeaderHomeLink>
      <LanguageToggle locale={lang} />
      <ThemeToggle locale={lang} />
    </HeaderRoot>
  );
}
