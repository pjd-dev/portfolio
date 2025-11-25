import { styled } from "@/stitches.config";

export const Thumb = styled("div", {
  position: "absolute",
  top: 0,
  left: "2px",
  right: "2px",
  borderRadius: "999px",
  glass: true,
  background:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.15), rgba(var(--foreground-rgb),0.3))",
  transformOrigin: "top",
});
