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

export function SiteHeader({
  lang,
  i18nSwitch = true,
  themeSwitch = true,
}: SiteHeaderProps) {
  return (
    <HeaderRoot aria-hidden="false" role="banner">
      <HeaderHomeLink href={`/${lang}`} external={false} prefetch>
        <HeaderLogo />
      </HeaderHomeLink>
      {i18nSwitch && <LanguageToggle locale={lang} />}
      {themeSwitch && <ThemeToggle locale={lang} />}
    </HeaderRoot>
  );
}
