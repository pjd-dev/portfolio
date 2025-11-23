import { styled } from "@/stitches.config";

export const Select = styled("select", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid rgba(var(--foreground-rgb), 0.2)",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  glass: true,
  // backgroundColor: "white",
  cursor: "pointer",

  "&:focus": {
    outline: "none",
    borderColor: "var(--foreground)",
    // todo Added focus style
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
