// components/ui/Wrapper.ts
import { styled } from "@/stitches.config";

export const Wrapper = styled("main", {
  position: "relative",
  width: "100%",

  // Page shell: viewport minus footer

  minHeight: "calc( 100dvh - var(--footer-height))",
  padding: "0",
  // margin: "0 auto",
  // Flex column container for sections
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap",
  flex: "auto",
  gap: "2rem",
  // backgroundColor: "aliceblue",
  // Avoid horizontal scroll glitches from parallax / hero
  overflowX: "hidden",
});
