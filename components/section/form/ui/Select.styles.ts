import { styled } from "@/stitches.config";

export const SelectRoot = styled("div", {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  width: "100%",
  color: "rgba(var(--background-rgb), 0.85)",

  "&::after": {
    content: "",
    position: "absolute",
    right: "0.9rem",
    top: "50%",
    transform: "translateY(-50%)",
    width: "1rem",
    height: "1rem",
    pointerEvents: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1rem 1rem",
    opacity: 0.9,
  },

  "&:focus-within": {
    color: "rgba(var(--background-rgb), 1)",
  },
});

export const Select = styled("select", {
  width: "100%",
  boxSizing: "border-box",
  appearance: "none",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  lineHeight: 1.4,
  padding: "0.95rem 2.4rem 0.95rem 0.9rem",
  borderRadius: "12px",
  backgroundColor: "rgba(var(--foreground-rgb), 0.08)",
  border: "1px solid rgba(var(--background-rgb), 0.2)",
  boxShadow:
    "0 0 0 1px rgba(var(--foreground-rgb), 0.08) inset, 0 8px 20px rgba(0,0,0,0.25)",
  color: "rgba(var(--background-rgb), 0.85)",
  cursor: "pointer",
  transition:
    "border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, color 0.18s ease",

  "&::placeholder": {
    color: "rgba(var(--foreground-rgb), 0.45)",
  },

  "&:focus-visible": {
    outline: "none",
    borderColor: "rgba(var(--background-rgb), 0.9)",
    backgroundColor: "rgba(var(--foreground-rgb), 0.14)",
    color: "rgba(var(--background-rgb), 1)",
    boxShadow:
      "0 0 0 2px rgba(var(--background-rgb), 0.22), 0 0 0 4px rgba(var(--foreground-rgb), 0.35)",
  },

  "&:hover": {
    backgroundColor: "rgba(var(--foreground-rgb), 0.12)",
    borderColor: "rgba(var(--background-rgb), 0.35)",
  },

  "&:disabled": {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "0 0 0 1px rgba(var(--foreground-rgb), 0.06) inset",
  },

  "& option": {
    backgroundColor: "rgb(var(--background-rgb))",
    color: "rgba(var(--foreground-rgb), 0.92)",
  },

  variants: {
    hasError: {
      true: {
        borderColor: "var(--error)",
      },
    },
  },
});
