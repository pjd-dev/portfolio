"use client";

import { styled } from "@/stitches.config";

export const Base = styled("div", {
  marginTop: "0.15rem",
  borderRadius: "1.25rem",
  backgroundImage:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.92) 0%, rgba(var(--foreground-rgb),0.82) 100%)",
  padding: "0.7rem 0.85rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "0.75rem",
  border: "1px solid rgba(var(--foreground-rgb),0.18)",
  boxShadow:
    "0 12px 24px rgba(var(--foreground-rgb),0.35), 0 0 0 1px rgba(var(--foreground-rgb),0.12) inset",

  "@bp1": {
    flexDirection: "column",
    alignItems: "stretch",
  },
});
