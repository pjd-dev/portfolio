import { styled } from "@/stitches.config";
export const Input = styled("input", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid rgba(var(--foreground-rgb), 0.2)",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",

  "&:focus": {
    outline: "none",
    borderColor: "var(--foreground)",
  },

  "&::placeholder": {
    color: "#999",
  },

  variants: {
    hasError: {
      true: {
        borderColor: "#ef4444",
        // todo Added error style
      },
    },
  },
});
