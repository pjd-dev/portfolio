import { styled } from "@/stitches.config";

export const Track = styled("div", {
  position: "absolute",
  // center vertically: 25% gap top + bottom
  top: "25%",
  bottom: "25%", // equivalent to height: 50%
  right: "0.25rem",
  width: "16px",
  borderRadius: "999px",
  background:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.12), rgba(var(--foreground-rgb),0.03))",
  glass: true,
  border: "1px solid rgba(var(--foreground-rgb),0.18)",
  overflow: "hidden",
});
