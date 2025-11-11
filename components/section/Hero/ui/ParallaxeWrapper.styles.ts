import { styled } from "@/stitches.config";

export const ParallaxeWrapper = styled("div", {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  overflow: "hidden",
  zIndex: 1,
  backgroundColor: "red",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
});
