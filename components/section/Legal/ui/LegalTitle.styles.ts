// components/ui/legal/LegalTitle.ts
import { styled } from "@/stitches.config";

export const LegalTitle = styled("h1", {
  fontSize: "1.75rem",
  lineHeight: 1.2,
  fontWeight: 600,

  "@md": { fontSize: "2rem" },
  "@lg": { fontSize: "2.25rem" },
});
