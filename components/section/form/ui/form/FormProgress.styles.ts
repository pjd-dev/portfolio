import { styled } from "@/stitches.config";

export const FormProgress = styled("div", {
  marginTop: "0.6rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
});

export const FormProgressLabel = styled("span", {
  fontSize: "0.65rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(var(--background-rgb),0.65)",
});

export const FormProgressDots = styled("div", {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
});

export const FormProgressDot = styled("span", {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "rgba(var(--background-rgb),0.28)",
  border: "1px solid rgba(var(--background-rgb),0.35)",
  boxShadow: "0 0 0 1px rgba(var(--foreground-rgb),0.25) inset",
  transition: "transform 0.2s ease, background 0.2s ease, border-color 0.2s ease",
  variants: {
    active: {
      true: {
        background: "rgba(var(--background-rgb),0.85)",
        borderColor: "rgba(var(--background-rgb),0.9)",
        transform: "scale(1.1)",
        boxShadow:
          "0 0 0 2px rgba(var(--background-rgb),0.15), 0 0 0 1px rgba(var(--foreground-rgb),0.35) inset",
      },
    },
  },
});
