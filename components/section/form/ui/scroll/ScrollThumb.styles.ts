import { styled } from "@/stitches.config";

export const ScrollThumb = styled("div", {
  position: "absolute",
  top: 0,
  left: "2px",
  right: "2px",
  borderRadius: "999px",
  background: "linear-gradient(180deg, rgba(37,37,62,1), rgba(16,16,34,1))",
  transformOrigin: "top",
});
