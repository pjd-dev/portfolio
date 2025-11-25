"use client";

import { styled } from "@/stitches.config";

export const Base = styled("div", {
  marginTop: "0.15rem",
  borderRadius: "1.25rem",
  backgroundColor: "rgba(var(--foreground-rgb),0.9)",
  padding: "0.7rem 0.85rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "0.75rem",

  "@bp1": {
    flexDirection: "column",
    alignItems: "stretch",
  },
});
