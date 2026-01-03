import { styled } from "@/stitches.config";

export const Thumb = styled("div", {
  position: "absolute",
  top: 0,
  left: "1px",
  right: "1px",
  borderRadius: "999px",
  glass: true,
  background:
    "linear-gradient(180deg, rgba(var(--background-rgb),0.65), rgba(var(--background-rgb),0.95))",
  border: "1px solid rgba(var(--background-rgb),0.85)",
  boxShadow:
    "0 10px 18px rgba(0,0,0,0.45), 0 0 0 1px rgba(var(--background-rgb),0.45) inset",
  transformOrigin: "top",
});
