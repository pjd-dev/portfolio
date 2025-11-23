import { styled } from "@/stitches.config";

export const ScrollTrack = styled("div", {
  position: "absolute",
  top: "0.75rem",
  bottom: "0.75rem",
  right: "0.25rem",
  width: "24px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  pointerEvents: "none",
  zIndex: 2,
});
