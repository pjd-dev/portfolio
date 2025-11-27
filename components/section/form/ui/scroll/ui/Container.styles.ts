import { styled } from "@/stitches.config";

export const Container = styled("div", {
  position: "relative",
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "1fr auto",
  overflow: "auto",
});
