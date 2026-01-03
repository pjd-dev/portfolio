import { styled } from "@/stitches.config";
export const SubmitButton = styled("button", {
  all: "unset",
  cursor: "pointer",
  borderRadius: "999px",
  padding: "0.55rem 1.6rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  backgroundImage:
    "linear-gradient(135deg, rgba(var(--foreground-rgb),0.95), rgba(var(--foreground-rgb),0.7))",
  color: "var(--background)",
  border: "1px solid rgba(var(--foreground-rgb),0.35)",
  boxShadow:
    "0 10px 24px rgba(var(--foreground-rgb),0.35), 0 0 0 1px rgba(var(--background-rgb),0.08) inset",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  transition:
    "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease, filter 120ms ease, visibility 120ms ease",

  "&[data-visible='false']": {
    display: "none",
  },

  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow:
      "0 14px 30px rgba(var(--foreground-rgb),0.45), 0 0 0 1px rgba(var(--background-rgb),0.12) inset",
    filter: "brightness(1.06)",
  },

  "&:active": {
    transform: "translateY(0)",
    boxShadow:
      "0 6px 16px rgba(var(--foreground-rgb),0.3), 0 0 0 1px rgba(var(--background-rgb),0.2) inset",
  },

  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.45,
    boxShadow:
      "0 4px 12px rgba(var(--foreground-rgb),0.2), 0 0 0 1px rgba(var(--background-rgb),0.1) inset",
    filter: "grayscale(0.35)",
  },

  "@bp1": {
    alignSelf: "flex-end",
  },
});
