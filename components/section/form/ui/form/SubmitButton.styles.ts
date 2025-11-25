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
  backgroundImage: "linear-gradient(90deg, #5b4bff, #37c6ff)",
  color: "#050608",
  boxShadow: "0 9px 22px rgba(0,0,0,0.55)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  transition:
    "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease, filter 120ms ease",

  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 11px 28px rgba(0,0,0,0.7)",
    filter: "brightness(1.04)",
  },

  "&:active": {
    transform: "translateY(0)",
    boxShadow: "0 5px 14px rgba(0,0,0,0.5)",
  },

  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.45,
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    filter: "grayscale(0.25)",
  },

  "@bp1": {
    alignSelf: "flex-end",
  },
});
