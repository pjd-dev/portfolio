import { styled } from "@/stitches.config";

export const WhoCell = styled("div", {
  gridArea: "who",
  minWidth: 0,
  minHeight: 0,
  // overflow: "hidden",
  containerType: "size",
  padding: "0.5rem 1rem", // mobile
  // backgroundColor: "DarkOrchid",
  "@md": {
    // backgroundColor: "red",
    containerType: "inline-size",
    paddingTop: "1rem",
  },
  // "@lg": { paddingTop: "2rem" },
});
