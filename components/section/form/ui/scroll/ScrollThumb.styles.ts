import { styled } from "@/stitches.config";

export const ScrollThumb = styled("div", {
  position: "absolute",
  left: 0,
  width: "30%",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.45)",
  boxShadow: "0 0 8px rgba(0,0,0,0.6)",
  transformOrigin: "top",
  pointerEvents: "none",
  transition: "background 120ms ease-out",
});
