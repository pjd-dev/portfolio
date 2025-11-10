// components/legal/LegalScroll.ts
import { styled } from "@/stitches.config";

export const LegalScroll = styled("div", {
  position: "relative",
  zIndex: 1, // under the blur overlays

  // maxHeight: "min(80vh, 720px)",
  overflowY: "auto",
  overflowX: "hidden",
  height: "100%",
  padding: "1.75rem 1.5rem 2.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",

  "@md": {
    padding: "2.5rem 2.75rem 3rem",
  },

  "@lg": {
    padding: "3rem 3.25rem 3.5rem",
  },
});
