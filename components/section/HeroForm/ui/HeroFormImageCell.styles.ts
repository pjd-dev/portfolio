"use client";
import { styled } from "@/stitches.config";

export const HeroFormImageCell = styled("div", {
  gridArea: "image",
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  "& > div": {
    width: "min(70vw, 360px)",
    "@sm": {
      width: "min(60vw, 420px)",
    },
    "@md": {
      width: "min(40vw, 420px)",
    },
    "@lg": {
      width: "min(32vw, 460px)",
    },
  },
  "@md": {
    justifyContent: "flex-start",
  },
  "@lg": {
    justifyContent: "center",
  },
});
