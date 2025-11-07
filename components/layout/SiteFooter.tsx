import {
  FooterRoot,
  FooterInner,
  FooterLinks,
  FooterLink,
  FooterMeta,
} from "../ui";

export type SiteFooterProps = {
  links: {
    privacyPolicy?: AppLinkConfig;
    termsOfService?: AppLinkConfig;
  };
  copyright: string;
};

export function SiteFooter({ links, copyright }: SiteFooterProps) {
  return (
    <FooterRoot aria-hidden={false} role="contentinfo">
      <FooterInner>
        <FooterLinks>
          {links.privacyPolicy && (
            <FooterLink
              href={links.privacyPolicy.href}
              rel={links.privacyPolicy.rel}
              target={links.privacyPolicy.target}
              prefetch
            >
              {links.privacyPolicy.label}
            </FooterLink>
          )}

          {links.termsOfService && (
            <FooterLink
              href={links.termsOfService.href}
              rel={links.termsOfService.rel}
              target={links.termsOfService.target}
              prefetch
            >
              {links.termsOfService.label}
            </FooterLink>
          )}
        </FooterLinks>

        <FooterMeta>{copyright}</FooterMeta>
      </FooterInner>
    </FooterRoot>
  );
}
