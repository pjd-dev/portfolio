import { styled } from "@/stitches.config";

export const TextArea = styled("textarea", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "1px solid rgba(var(--background-rgb), 0.2)",
  borderRadius: "12px",
  transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
  glass: true,
  fontFamily: "inherit",
  color: "var(--background)",
  minHeight: "150px",
  resize: "vertical",
  backgroundColor: "rgba(var(--foreground-rgb), 0.08)",
  boxShadow:
    "0 0 0 1px rgba(var(--foreground-rgb), 0.08) inset, 0 8px 20px rgba(0,0,0,0.25)",
  "&:focus": {
    outline: "none",
    borderColor: "var(--background)",
  },
  "&:focus-visible": {
    borderColor: "rgba(var(--background-rgb), 0.9)",
    boxShadow:
      "0 0 0 3px rgba(var(--background-rgb), 0.28), 0 0 0 6px rgba(var(--foreground-rgb), 0.4)",
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
