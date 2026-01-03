"use client";

import { styled } from "@/stitches.config";

export const Root = styled("footer", {
  marginTop: "1rem",
  borderRadius: "1.5rem",
  border: "1px solid rgba(var(--foreground-rgb),0.22)",
  backgroundImage:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.78) 0%, rgba(var(--foreground-rgb),0.62) 100%)",
  boxShadow:
    "0 22px 46px rgba(var(--foreground-rgb),0.45), 0 0 0 1px rgba(var(--foreground-rgb),0.2) inset",
  glass: true,
  padding: "0.75rem 1rem 0.85rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
  position: "sticky",
  bottom: 0,
  zIndex: 2,
  paddingTop: "0.5rem",
});
