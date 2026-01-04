"use client";
import { langSelector, styled } from "@/stitches.config";

export const HeroFormHeadline = styled("h2", {
  heroBevel: true,
  fontFamily: "var(--font-WildWorld)",
  textTransform: "uppercase",
  userSelect: "none",
  textAlign: "right",
  fontSize: "clamp(28px, 8vw, 54px)",
  "@coarse": { "@md": { fontSize: "clamp(28px, 6vw, 54px)" } },
  "@portrait": {
    "@md": { fontSize: "clamp(30px, 6.5vw, 56px)" },
  },
  "@lg": { fontSize: "clamp(32px, 4.5vw, 72px)" },
  lineHeight: "0.96",
  [langSelector.fr]: {
    fontFamily: "var(--font-Cako)",
    fontWeight: 600,
    fontSize: "clamp(30px, 7vw, 68px)",
    "@coarse": { "@md": { fontSize: "clamp(30px, 5.5vw, 68px)" } },
    "@portrait": {
      "@md": { fontSize: "clamp(32px, 6.5vw, 68px)" },
    },
  },
});
