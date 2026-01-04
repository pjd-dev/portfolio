"use client";
import { styled } from "@/stitches.config";

export const HeroFormFormCell = styled("div", {
  gridArea: "form",
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  "@md": {
    justifyContent: "flex-end",
  },
});
