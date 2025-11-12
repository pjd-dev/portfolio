"use client";
import { styled } from "@/stitches.config";

export const Grid = styled("div", {
  position: "relative",
  minHeight: "100%",
  height: "100%",
  width: "100%",
  display: "grid",
  minWidth: 0,
  gridAutoRows: "auto",
  gridTemplateAreas: `
    "who empty"
    "what what"
    "cta cta"
  `,
  gridTemplateColumns: "auto 20%",
  gridTemplateRows: "45% auto 10%",

  "@md": {
    gridTemplateAreas: `
      "who cta"
      "who cta"
      "who what"
    `,
    gridTemplateColumns: "35% 1fr",
    gridTemplateRows: "auto 1fr auto",
  },
  "@portrait": {
    "@md": {
      gridTemplateColumns: "45% auto",
    },
  },
  "@lg": {
    gridTemplateAreas: `
      "who cta"
      "who cta"
      "who what"
    `,
    gridTemplateColumns: "25% 1fr",
    gridTemplateRows: "20% 1fr auto",
  },
});
