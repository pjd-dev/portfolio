import { styled } from "@/stitches.config";

export const FormCard = styled("form", {
  position: "relative",
  width: "100%",
  maxHeight: "80svh",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  gap: "0.75rem",
  padding: "0.75rem",
  borderRadius: "1.75rem",
  // border: "1px solid rgba(255,255,255,0.16)",

  backdropFilter: "blur(22px)",

  glass: true,
  // boxShadow: "0 18px 40px rgba(var(--foreground-rgb),0.45)",
  boxShadow:
    "0 10px 38px rgba(var(--foreground-rgb ),0.30), 0 10px 20px rgba(var(--foreground-rgb ),0.22)",
  background: "rgba(var(--foreground-rgb),0.85)",
  overflow: "hidden",
});
