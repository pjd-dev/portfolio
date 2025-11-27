import { styled } from "@/stitches.config";
export const Viewport = styled("div", {
  position: "relative",
  height: "100%",
  overflowY: "auto",
  padding: "0.75rem 1.55rem 0 0.75rem",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    width: 0,
    height: 0,
  },
});
