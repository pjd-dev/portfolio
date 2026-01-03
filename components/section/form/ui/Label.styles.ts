import { styled } from "@/stitches.config";
export const Label = styled("label", {
  display: "inline-flex",
  alignItems: "baseline",
  fontSize: "0.875rem",
  fontWeight: "600",
  marginBottom: 0,
  color: "var(--background)",
  variants: {
    required: {
      true: {
        "&::after": {
          content: '" *"',
          marginLeft: "0.2rem",
          color: "var(--error)",
          fontWeight: 700,
        },
      },
    },
  },
});
