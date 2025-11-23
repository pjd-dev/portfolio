import { styled } from "@/stitches.config";
export const ScrollViewport = styled("div", {
  position: "relative",
  overflowY: "auto",
  paddingRight: "1.25rem", // room for the custom bar
  // optional: hide native scrollbar (modern browsers)
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    width: 0,
    height: 0,
  },
});
