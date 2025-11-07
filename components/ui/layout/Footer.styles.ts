// components/layout/SiteFooter.tsx
import Link from "next/link";
import { styled } from "@/stitches.config";
// const FooterButtonStyle =
//   "text-[0.5rem] md:text-xs  p-[0.8rem] md:p-4 hover:underline ";
{
  /*<footer
  className=" h-[var(--footer-height)] flex w-full  items-center justify-between px-4 md:px-8  lg:px-12  inset-0 "
  aria-hidden="false"
  role="contentinfo"
>
  <div className="flex gap-1 -ml-4">
    {dictionary.layout.footer.links.privacyPolicy && (
      <a
        href={dictionary.layout.footer.links.privacyPolicy.href}
        rel={dictionary.layout.footer.links.privacyPolicy.rel}
        target={dictionary.layout.footer.links.privacyPolicy.target}
        className={FooterButtonStyle}
      >
        {dictionary.layout.footer.links.privacyPolicy.label}
      </a>
    )}

    {dictionary.layout.footer.links.termsOfService && (
      <a
        href={dictionary.layout.footer.links.termsOfService.href}
        rel={dictionary.layout.footer.links.termsOfService.rel}
        target={dictionary.layout.footer.links.termsOfService.target}
        className={FooterButtonStyle}
      >
        {dictionary.layout.footer.links.termsOfService.label}
      </a>
    )}
  </div>
  <div className="flex items-center justify-between text-[0.5rem] sm:text-xs md:text-sm">
    {dictionary.layout.footer.copyright}
  </div>
</footer>*/
}
export const FooterRoot = styled("footer", {
  height: "var(--footer-height)",
  width: "100%",
  borderTop: "1px solid var(--border-subtle)",
  display: "flex",
  alignItems: "center",
});

export const FooterInner = styled("div", {
  width: "100%",
  margin: "0 auto",
  paddingInline: "1rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "0.25rem",
  "@sm": {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  "@md": {
    paddingInline: "2rem",
  },

  "@lg": {
    paddingInline: "3rem",
  },
});

export const FooterLinks = styled("nav", {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem",

  "@sm": {
    gap: "0.5rem",
  },
});

export const FooterLink = styled(Link, {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  paddingInline: "0.6rem",
  paddingBlock: "0.25rem",
  borderRadius: "999px",
  fontSize: "0.65rem",
  lineHeight: 1,
  color: "var(--text-subtle)",
  textDecoration: "none",
  border: "1px solid var(--border-subtle)",
  backgroundColor:
    "color-mix(in srgb, var(--surface-elevated) 80%, transparent)",

  "@sm": {
    fontSize: "0.7rem",
  },

  "@md": {
    fontSize: "0.75rem",
  },

  "&:hover": {
    color: "var(--text-strong)",
    borderColor: "var(--border-strong)",
    backgroundColor:
      "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
  },
});

export const FooterMeta = styled("p", {
  fontSize: "0.55rem",
  color: "var(--text-subtle)",
  lineHeight: 1.4,

  "@sm": {
    fontSize: "0.65rem",
    textAlign: "right",
  },

  "@md": {
    fontSize: "0.75rem",
  },
});
