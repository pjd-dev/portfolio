// FieldGroup.styles.ts
import { styled } from "@/stitches.config";

export const FieldGroup = styled("div", {
  marginBottom: "1.5rem",
  width: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",

  variants: {
    width: {
      full: {
        gridColumn: "1 / -1",
      },
      "1/2": {
        gridColumn: "1 / -1",
        "@md": { gridColumn: "span 6" },
      },
      "1/3": {
        gridColumn: "1 / -1",
        "@md": { gridColumn: "span 4" },
      },
    },
  },
  defaultVariants: {
    width: "full",
  },
});
