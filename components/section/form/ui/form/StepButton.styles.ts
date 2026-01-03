import { styled } from "@/stitches.config";

export const StepControls = styled("div", {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  flexWrap: "wrap",
  justifyContent: "flex-end",
});

export const StepButton = styled("button", {
  appearance: "none",
  borderRadius: "999px",
  padding: "0.45rem 0.9rem",
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  border: "1px solid rgba(var(--background-rgb),0.25)",
  background: "rgba(var(--foreground-rgb),0.2)",
  color: "rgba(var(--background-rgb),0.85)",
  cursor: "pointer",
  transition: "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
  "&:hover": {
    background: "rgba(var(--foreground-rgb),0.32)",
    borderColor: "rgba(var(--background-rgb),0.4)",
    transform: "translateY(-1px)",
  },
  "&:disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
    transform: "none",
  },
  variants: {
    tone: {
      primary: {
        background: "rgba(var(--background-rgb),0.85)",
        color: "rgba(var(--foreground-rgb),0.9)",
        borderColor: "rgba(var(--background-rgb),0.9)",
        boxShadow: "0 8px 16px rgba(var(--foreground-rgb),0.3)",
        "&:hover": {
          background: "rgba(var(--background-rgb),0.95)",
        },
      },
    },
  },
});
