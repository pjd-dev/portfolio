import { styled } from "@/stitches.config";

export const WhoCell = styled("div", {
  gridArea: "who",
  minWidth: 0,
  minHeight: 0,
  containerType: "size",
  padding: "0.5rem 1rem",
  "@md": {
    containerType: "inline-size",
    paddingTop: "1rem",
  },
});
