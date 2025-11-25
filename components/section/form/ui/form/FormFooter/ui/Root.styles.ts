"use client";

import { styled } from "@/stitches.config";

export const Root = styled("footer", {
  marginTop: "1rem",
  borderRadius: "1.5rem",
  border: "1px solid $border",
  backgroundColor: "rgba(var(--foreground-rgb),0.7)",
  boxShadow: "0 18px 40px rgba(var(--foreground-rgb),0.45)",

  padding: "0.75rem 1rem 0.85rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
});
