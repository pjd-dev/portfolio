import { styled } from "@/stitches.config";

export const ParallaxeWrapper = styled("section", {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  padding: 0,
  margin: 0,
  overflow: "hidden",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
});
