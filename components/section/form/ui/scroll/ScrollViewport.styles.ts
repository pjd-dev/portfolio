import { styled } from "@/stitches.config";
export const ScrollViewport = styled("div", {
  position: "relative",
  height: "100%",
  overflowY: "auto",
  padding: "0.75rem 1.5rem 0.75rem 0.75rem", // right padding = room for pill
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    width: 0,
    height: 0,
  },
});
