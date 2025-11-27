import { styled } from "@/stitches.config";

export const SelectRoot = styled("div", {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  width: "100%",

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
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1rem 1rem",
    opacity: 0.9,
  },
});

export const Select = styled("select", {
  width: "100%",
  boxSizing: "border-box",
  appearance: "none",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  lineHeight: 1.4,
  padding: "1rem 2.4rem 1rem 0.9rem",
  borderRadius: "999px",

  // keep glass, but override its darkest properties
  glass: true,
  tintGlass: "var(--foreground-rgb)",

  // FIX → lighten background explicitly
  backgroundColor: "rgba(var(--foreground-rgb), 0.12)",

  // FIX → lighten inner shadow so it doesn’t crush contrast
  boxShadow: "0 0 0 1px rgba(var(--foreground-rgb), 0.10), 0 6px 18px rgba(0,0,0,0.25)",

  border: "1px solid rgba(var(--foreground-rgb), 0.16)",
  color: "rgba(var(--background-rgb), 0.85)",
  cursor: "pointer",
  transition:
    "border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, color 0.18s ease",

  "&::placeholder": {
    color: "rgba(var(--foreground-rgb), 0.45)",
  },

  "&:focus-visible": {
    outline: "none",
    borderColor: "rgba(var(--accent-rgb), 0.9)",
    backgroundColor: "rgba(var(--foreground-rgb), 0.18)", // lighter focus
    color: "rgba(var(--background-rgb), 1)",
    boxShadow:
      "0 0 0 1px rgba(var(--foreground-rgb), 0.6), 0 10px 28px rgba(var(--foreground-rgb),0.45)",
  },

  "&:hover": {
    backgroundColor: "rgba(var(--foreground-rgb), 0.16)",
    borderColor: "rgba(var(--background-rgb), 0.28)",
  },

  "&:disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
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
