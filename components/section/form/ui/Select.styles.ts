import { styled } from "@/stitches.config";

export const Select = styled("select", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid #e0e0e0",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  backgroundColor: "white",
  cursor: "pointer",

  "&:focus": {
    outline: "none",
    borderColor: "#000",
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
