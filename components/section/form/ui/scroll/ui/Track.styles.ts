import { styled } from "@/stitches.config";

export const Track = styled("div", {
  position: "absolute",
  // center vertically: 25% gap top + bottom
  top: "33.333%",
  bottom: "33.333%", // 1/3 of the card height
  right: "0.2rem",
  width: "10px",
  borderRadius: "999px",
  background:
    "linear-gradient(180deg, rgba(var(--background-rgb),0.35), rgba(var(--background-rgb),0.12))",
  glass: true,
  border: "1px solid rgba(var(--background-rgb),0.45)",
  boxShadow:
    "0 0 0 1px rgba(var(--background-rgb),0.25) inset, 0 8px 16px rgba(0,0,0,0.35)",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: "1px",
    borderRadius: "inherit",
    background:
      "linear-gradient(180deg, rgba(var(--background-rgb),0.25), rgba(var(--background-rgb),0))",
    pointerEvents: "none",
  },
});
