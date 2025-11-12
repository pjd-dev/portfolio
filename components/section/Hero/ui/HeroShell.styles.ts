"use client";
import { styled } from "@/stitches.config";

export const HeroShell = styled("div", {
  position: "relative",
  width: "100%",
  height: "calc( 100dvh - var(--footer-height))",
  paddingLeft: "2rem",
  paddingRight: "2rem",
  "@md": {
    paddingLeft: "3rem",
    paddingRight: "3rem",
  },
  "@lg": {
    paddingLeft: "3.5rem",
    paddingRight: "3.5rem",
  },
  display: "flex",
  overflow: "hidden",
});
