// components/section/form/ui/FormFooter.tsx
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

const BaseHint = styled("div", {
  flex: 1,
  minWidth: 0,
  fontSize: "0.7rem",
  color: "rgba(var(--background-rgb),0.6)",

  "@bp1": {
    order: 2,
  },
});
