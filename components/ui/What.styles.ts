import { styled } from "@/stitches.config";

export const What = styled("h2", {
  fontFamily: "WildWorld, sans-serif",
  textTransform: "uppercase",
  userSelect: "none",
  textAlign: "right",
  fontSize: "clamp(32px, calc(20cqh - 2rem), 64px)",
  "@coarse": { "@md": { fontSize: "clamp(32px, calc(12cqw - 2rem), 64px)" } },
  "@portrait": {
    "@md": { fontSize: "clamp(32px, calc(18cqw - 2rem), 64px)" },
  },
  "@lg": { fontSize: "clamp(32px, calc(12cqw - 2rem), 72px)" },
  lineHeight: "0.96",
});
