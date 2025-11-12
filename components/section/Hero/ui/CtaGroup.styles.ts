"use client";
import { styled } from "@/stitches.config";

export const CtaGroup = styled("div", {
  display: "flex",
  gap: "0.5rem",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  "@md": {
    gap: "1rem",
  },
  "@portrait": {
    "@md": {
      gap: "2rem",
      flexDirection: "column",
      justifyContent: "end",
      alignItems: "stretch",
    },
  },
});
