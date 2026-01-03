import { styled } from "@/stitches.config";
export const Input = styled("input", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  backgroundColor: "rgba(var(--foreground-rgb), 0.08)",
  border: "1px solid rgba(var(--background-rgb), 0.2)",
  borderRadius: "12px",
  transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
  fontFamily: "inherit",
  color: "var(--background)",
  boxShadow:
    "0 0 0 1px rgba(var(--foreground-rgb), 0.08) inset, 0 6px 18px rgba(0,0,0,0.28)",
  "&:focus": {
    outline: "none",
    borderColor: "var(--background)",
  },
  "&:focus-visible": {
    borderColor: "rgba(var(--background-rgb), 0.9)",
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

  "&::placeholder": {
    color: "rgba(var(--background-rgb), 0.3)",
  },

  variants: {
    hasError: {
      true: {
        borderColor: "var(--error)",
        boxShadow:
          "0 0 0 1px rgba(var(--error-rgb), 0.45) inset, 0 8px 18px rgba(var(--error-rgb), 0.2)",
      },
    },
  },
});
