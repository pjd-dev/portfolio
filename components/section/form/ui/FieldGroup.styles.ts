// FieldGroup.styles.ts
import { styled } from "@/stitches.config";

export const FieldGroup = styled("div", {
  marginBottom: "1.5rem",
  width: "100%",
  minWidth: 0,
  scrollMarginTop: "6rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",

  variants: {
    span: {
      full: {
        gridColumn: "1 / -1",
      },
      "1/2": {
        gridColumn: "1 / -1",
        "@container form-card (min-width: 520px)": {
          gridColumn: "span 3 / span 3",
        },
      },
      "1/3": {
        gridColumn: "1 / -1",
        "@container form-card (min-width: 640px)": {
          gridColumn: "span 2 / span 2",
        },
      },
    },
  },
  defaultVariants: {
    span: "full",
  },
});
