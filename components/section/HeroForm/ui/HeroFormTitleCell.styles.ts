import { styled } from "@/stitches.config";

export const HeroFormTitleCell = styled("div", {
  gridArea: "title",
  minWidth: 0,
  minHeight: 0,
  containerType: "size",
  padding: "0 1rem",
  "@md": {
    containerType: "inline-size",
    paddingTop: "1rem",
  },
});
