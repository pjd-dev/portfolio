import { styled } from "@/stitches.config";
export const Viewport = styled("div", {
  position: "relative",
  height: "100%",
  overflowY: "auto",
  padding: "0 0 6rem 0",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    width: 0,
    height: 0,
  },
});
