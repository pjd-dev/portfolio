// import LanguageToggle from "@/components/composites/LanguageToggle";
import type { HeaderLayout } from "@/lib/validation/layoutDictionarySchema";
import dynamic from "next/dynamic";
import { HeaderHomeLink, HeaderLogo, HeaderRoot } from "../ui";
const ThemeToggle = dynamic(() => import("@/components/composites/ThemeToggle"), {
  ssr: false,
});
const LanguageToggle = dynamic(() => import("@/components/composites/LanguageToggle"), {
  ssr: false,
});
type SiteHeaderProps = HeaderLayout & {
  lang: Locale;
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
