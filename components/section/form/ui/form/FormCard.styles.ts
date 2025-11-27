import { styled } from "@/stitches.config";

// FormCard.styles.ts
export const FormCard = styled("form", {
  position: "relative",
  width: "100%",
  maxHeight: "80svh",

  display: "flex",
  flexDirection: "column",

  gap: "0.75rem",
  padding: "0.75rem",
  borderRadius: "1.75rem",

  backdropFilter: "blur(22px)",
  glass: true,
  boxShadow:
    "0 10px 38px rgba(var(--foreground-rgb),0.30), 0 10px 20px rgba(var(--foreground-rgb),0.22)",

  background: "rgba(var(--foreground-rgb),0.85)",
  overflow: "hidden",
});
