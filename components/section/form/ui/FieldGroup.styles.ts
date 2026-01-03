// FieldGroup.styles.ts
import { styled } from "@/stitches.config";

export const FieldGroup = styled("div", {
  marginBottom: "1.5rem",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",

  variants: {
    width: {
      full: {
        gridColumn: "1 / -1",
      },
      "1/2": {
        "@md": { width: "50%" },
      },
      "1/3": {
        "@md": { width: "33.333%" },
      },
    },
  },
  defaultVariants: {
    width: "full",
  },
});
