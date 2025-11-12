"use client";
import { styled } from "@/stitches.config";

export const Who = styled("h1", {
  heroBevel: true,
  fontFamily: "var(--font-CondeSans)",
  textTransform: "uppercase",
  userSelect: "none",
  fontSize: "clamp(64px, calc(45cqh - 1rem), 170px)",
  lineHeight: 0.9,
  "@sm": {
    fontSize: "clamp(64px, calc(94cqw - 1rem), 170px)",
    lineHeight: 0.85,
  },
  "@md": {
    fontSize: "clamp(96px, calc(98cqh - 1rem), 333px)",
    lineHeight: 0.8,
  },
  "@lg": {
    fontSize: "clamp(128px, calc(92cqw - 1rem), 666px)",
    lineHeight: 0.86,
  },
  "@landscape": {
    "@lg": {
      fontSize: "clamp(128px, calc(92cqw - 1rem), 666px)",
      lineHeight: 0.86,
    },
  },
});
