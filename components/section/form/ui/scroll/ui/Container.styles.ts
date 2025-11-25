import { styled } from "@/stitches.config";

export const Container = styled("div", {
  position: "relative",
  flex: 1,
  display: "grid",
  gridTemplateColumns: "1fr", // content only, scrollbar overlaid
  overflow: "auto",
});
