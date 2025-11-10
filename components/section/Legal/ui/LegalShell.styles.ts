// components/ui/legal/LegalShell.ts
import { styled } from "@/stitches.config";

export const LegalShell = styled("section", {
  position: "relative",
  width: "100%",
  maxWidth: "40rem",
  borderRadius: "1.5rem",
  border: "1px solid var(--border-subtle)",
  backgroundColor: "rgba(var(--foreground-rgb), 0.08)",
  boxShadow:
    "0 1px 2px rgba(var(--foreground-rgb), 0.25),0 0 0 1px rgba(var(--foreground-rgb), 0.05) inset",
  "@md": {
    maxWidth: "52rem", // ~832px on desktop
    // padding: "2.5rem 2.75rem 3rem",
  },
  "@lg": {
    maxWidth: "60rem",
    // padding: "3rem 3.25rem 3.5rem",
  },
  overflow: "hidden",
});
