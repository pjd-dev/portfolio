import { styled } from "@/stitches.config";

export const Thumb = styled("div", {
  position: "absolute",
  top: 0,
  left: "1px",
  right: "1px",
  borderRadius: "999px",
  glass: true,
  background:
    "linear-gradient(180deg, rgba(var(--background-rgb),0.55), rgba(var(--background-rgb),0.95))",
  border: "1px solid rgba(var(--background-rgb),0.7)",
  boxShadow:
    "0 8px 16px rgba(0,0,0,0.45), 0 0 0 1px rgba(var(--background-rgb),0.3) inset",
  transformOrigin: "top",
  transition: "transform 0.16s ease, height 0.16s ease",
});
