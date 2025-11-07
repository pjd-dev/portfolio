// components/ui/legal/LegalHeader.ts
import { styled } from "@/stitches.config";

export const LegalHeader = styled("header", {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  textAlign: "left",
  marginTop: "6rem",
  "@md": {
    textAlign: "center",
    alignItems: "center",
  },
});
