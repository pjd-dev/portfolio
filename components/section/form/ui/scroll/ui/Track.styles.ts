import { styled } from "@/stitches.config";

export const Track = styled("div", {
  position: "absolute",
  // center vertically: 25% gap top + bottom
  top: "33.333%",
  bottom: "33.333%", // 1/3 of the card height
  right: "0.35rem",
  width: "8px",
  borderRadius: "999px",
  background:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.35), rgba(var(--foreground-rgb),0.12))",
  glass: true,
  border: "1px solid rgba(var(--background-rgb),0.2)",
  boxShadow:
    "0 0 0 1px rgba(var(--foreground-rgb),0.2) inset, 0 10px 18px rgba(0,0,0,0.35)",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: "1px",
    borderRadius: "inherit",
    background:
      "linear-gradient(180deg, rgba(var(--background-rgb),0.25), rgba(var(--background-rgb),0.05))",
    pointerEvents: "none",
  },
});
