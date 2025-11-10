// components/ui/legal/LegalFooter.tsx
import { styled } from "@/stitches.config";

export const LegalFooter = styled("footer", {
  marginTop: "2rem",
  paddingTop: "0.75rem",
  borderTop: "1px solid var(--border-subtle)",

  fontSize: "0.75rem",
  lineHeight: 1.6,
  color: "var(--text-subtle)",

  "@md": {
    marginTop: "2.5rem",
    paddingTop: "1rem",
  },
});
