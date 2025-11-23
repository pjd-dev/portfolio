import { styled } from "@/stitches.config";

export const ScrollContainer = styled("div", {
  position: "relative",
  flex: 1,
  display: "grid",
  gridTemplateColumns: "1fr", // content only, scrollbar overlaid
  overflow: "auto",
});
