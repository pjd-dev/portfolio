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
              // <FooterLink
              //   href={links.privacyPolicy.href}
              //   rel={links.privacyPolicy.rel}
              //   target={links.privacyPolicy.target}
              //   prefetch
              // >
              //   {links.privacyPolicy.label}
              // </FooterLink>
            )}

            {links.termsOfService && (
              <AppLink
                cta={links.termsOfService}
                linkProps={{
                  prefetch: true,
                }}
              />
              // <FooterLink
              //   href={links.termsOfService.href}
              //   rel={links.termsOfService.rel}
              //   target={links.termsOfService.target}
              //   prefetch
              // >
              //   {links.termsOfService.label}
              // </FooterLink>
            )}
          </FooterLinks>
        )}

        <FooterMeta>{copyright}</FooterMeta>
      </FooterInner>
    </FooterRoot>
  );
}
