"use client";
import { langSelector, styled } from "@/stitches.config";

export const What = styled("h2", {
  heroBevel: true,
  fontFamily: "var(--font-WildWorld)",
  textTransform: "uppercase",
  userSelect: "none",
  textAlign: "right",
  fontSize: "clamp(32px, calc(15cqw - 2rem), 64px)",
  "@coarse": { "@md": { fontSize: "clamp(32px, calc(12cqw - 2rem), 64px)" } },
  "@portrait": {
    "@md": { fontSize: "clamp(32px, calc(18cqw - 2rem), 64px)" },
  },
  "@lg": { fontSize: "clamp(32px, calc(12cqw - 2rem), 72px)" },
  lineHeight: "0.96",
  [langSelector.fr]: {
    fontFamily: "var(--font-Cako)",
    fontWeight: 600,
    fontSize: "clamp(32px, calc(18cqw - 2rem), 72px)",
    "@coarse": { "@md": { fontSize: "clamp(32px, calc(14cqw - 2rem), 72px)" } },
    "@portrait": {
      "@md": { fontSize: "clamp(32px, calc(20cqw - 2rem), 72px)" },
    },
  },
});
