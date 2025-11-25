import { styled } from "@/stitches.config";
export const Input = styled("input", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid rgba(var(--background-rgb), 0.2)",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  color: "var(--background)",
  "&:focus": {
    outline: "none",
    borderColor: "var(--background)",
  },

  "&::placeholder": {
    color: "rgba(var(--background-rgb), 0.2)",
  },

  variants: {
    hasError: {
      true: {
        borderColor: "var(--error)",
      },
    },
  },
});
