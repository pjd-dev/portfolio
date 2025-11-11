"use client";
import { styled } from "@/stitches.config";

export const CtaCell = styled("div", {
  gridArea: "cta",
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
  padding: "2rem 1rem",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  "@md": {
    padding: "0.5rem 1rem",
    justifyContent: "end",
    alignItems: "end",
  },
});
