import type { FooterLayout } from "@/lib/validation/layoutDictionarySchema";
import { AppLink } from "../navigation/AppLink";
import { FooterInner, FooterLinks, FooterMeta, FooterRoot } from "../ui";
export function SiteFooter({ links, copyright }: FooterLayout) {
  return (
    <FooterRoot aria-hidden={false} role="contentinfo">
      <FooterInner>
        {links && (
          <FooterLinks>
            {links.privacyPolicy && (
              <AppLink
                cta={links.privacyPolicy}
                linkProps={{
                  prefetch: true,
                }}
              />
            )}

            {links.termsOfService && (
              <AppLink
                cta={links.termsOfService}
                linkProps={{
                  prefetch: true,
                }}
              />
            )}
          </FooterLinks>
        )}

        <FooterMeta>{copyright}</FooterMeta>
      </FooterInner>
    </FooterRoot>
  );
}
