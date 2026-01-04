"use client";
import { styled } from "@/stitches.config";

export const HeroFormShell = styled("section", {
  position: "relative",
  width: "100%",
  minHeight: "calc(100dvh - var(--footer-height))",
  paddingTop: "1.5rem",
  paddingBottom: "1.5rem",
  paddingLeft: "2rem",
  paddingRight: "2rem",
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  overflowX: "hidden",
  overflowY: "visible",

  "@md": {
    height: "calc(100dvh - var(--footer-height))",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: "3rem",
    paddingRight: "3rem",
    overflowY: "hidden",
  },
  "@lg": {
    paddingLeft: "3.5rem",
    paddingRight: "3.5rem",
  },
});
