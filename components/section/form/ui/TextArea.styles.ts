import { styled } from "@/stitches.config";

export const TextArea = styled("textarea", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid rgba(var(--foreground-rgb), 0.2)",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  minHeight: "150px",
  resize: "vertical",
  glass: true,
  "&:focus": {
    outline: "none",
    borderColor: "var(--foreground)",
  },

  "&::placeholder": {
    color: "rgba(var(--foreground-rgb), 0.2)",
  },

  variants: {
    hasError: {
      true: {
        borderColor: "var(--error)",
        // Added error style
      },
    },
  },
});
