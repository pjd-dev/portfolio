import { styled } from "@/stitches.config";

export const Who = styled("h1", {
  fontFamily: "CondeSans, sans-serif",
  textTransform: "uppercase",
  userSelect: "none",
  fontSize: "clamp(64px, calc(45cqh - 1rem), 222px)",
  lineHeight: 0.9,
  "@sm": {
    fontSize: "clamp(80px, calc(94cqw - 1rem), 222px)",
    lineHeight: 0.85,
  },
  "@md": {
    fontSize: "clamp(96px, calc(98cqw - 1rem), 222px)",
    lineHeight: 0.8,
  },
  "@lg": {
    fontSize: "clamp(128px, calc(76cqw - 1rem), 333px)",
    lineHeight: 0.86,
  },
  "@landscape": {
    "@lg": {
      fontSize: "clamp(128px, calc(92cqw - 1rem), 333px)",
      lineHeight: 0.86,
    },
  },
});
