"use client";
import { styled } from "@/stitches.config";

export const HeroFormGrid = styled("div", {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  display: "grid",
  gap: "1.75rem",
  alignItems: "center",
  gridTemplateAreas: `
    "title"
    "image"
    "headline"
    "form"
  `,
  gridTemplateColumns: "minmax(0, 1fr)",

  "@md": {
    height: "100%",
    gridTemplateAreas: `
      "title form"
      "image form"
      "headline form"
    `,
    gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
    columnGap: "2.5rem",
    rowGap: "2rem",
    alignContent: "center",
  },

  "@lg": {
    gridTemplateAreas: `
      "title image headline"
      "title image form"
    `,
    gridTemplateColumns: "minmax(0, 0.65fr) minmax(0, 0.7fr) minmax(0, 1fr)",
    columnGap: "3rem",
    rowGap: "2.5rem",
  },

  variants: {
    hasHeadline: {
      false: {
        gridTemplateAreas: `
          "title"
          "image"
          "form"
        `,
        "@md": {
          gridTemplateAreas: `
            "title form"
            "image form"
          `,
          gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)",
        },
        "@lg": {
          gridTemplateAreas: `"title image form"`,
          gridTemplateColumns:
            "minmax(0, 0.6fr) minmax(0, 0.7fr) minmax(0, 1.2fr)",
          rowGap: "0",
        },
      },
    },
  },

  defaultVariants: {
    hasHeadline: true,
  },
});
