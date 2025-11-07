// components/layout/SiteFooter.tsx
import Link from "next/link";
import { styled } from "@/stitches.config";

export const FooterRoot = styled("footer", {
  height: "var(--footer-height)",
  width: "100%",
  display: "flex",
  alignItems: "center",
});

export const FooterInner = styled("div", {
  width: "100%",
  margin: "0 auto",
  paddingInline: "1rem",
  paddingBottom: "1rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "0.35rem",

  // slightly more breathing room on small screens
  "@sm": {
    paddingInline: "1.5rem",
  },

  // from md up: single horizontal bar, links left / meta right
  "@md": {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: "2rem",
    gap: "0.5rem",
    paddingBottom: "0",
  },

  "@lg": {
    paddingInline: "3rem",
  },
});

export const FooterLinks = styled("nav", {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem",
  justifyContent: "center",
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
  fontSize: "0.65rem",
  lineHeight: 1,
  textDecoration: "none",

  "@sm": {
    fontSize: "0.7rem",
  },

  "@md": {
    fontSize: "0.75rem",
  },

  "&:hover": {
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    cursor: "pointer",
  },
});

export const FooterMeta = styled("p", {
  fontSize: "0.55rem",
  lineHeight: 1.4,
  width: "100%",
  textAlign: "center", // @sm: centered second row
  alignSelf: "center",

  "@sm": {
    fontSize: "0.65rem",
  },

  "@md": {
    fontSize: "0.75rem",
    width: "auto", // shrink to content
    textAlign: "right", // right-aligned in the bar
    alignSelf: "auto",
  },
});
