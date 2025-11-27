import { styled } from "@/stitches.config";

export const SectionOuter = styled("section", {
  width: "100%",
  maxHeight: "calc( 100svh - var(--footer-height))",
  boxSizing: "border-box",
  paddingInline: "var(--page-padding-x, 1.5rem)",
  paddingBlock: "var(--section-spacing-y, 4rem)",

  "@md": {
    paddingInline: "var(--page-padding-x-md, 2rem)",
    paddingBlock: "var(--section-spacing-y-md, 5rem)",
  },

  variants: {
    bleed: {
      none: {},
      x: { paddingInline: 0 },
      y: { paddingBlock: 0 },
      both: { paddingInline: 0, paddingBlock: 0 },
    },
    tone: {
      plain: {},
      surface: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
      },
      inverted: {
        backgroundColor: "var(--foreground)",
        color: "var(--background)",
      },
    },
  },

  defaultVariants: {
    bleed: "none",
    tone: "plain",
  },
});

export const SectionInner = styled("div", {
  maxWidth: "960px",
  margin: "0 auto",
  display: "grid",
  gap: "1.75rem",

  variants: {
    layout: {
      single: {
        gridTemplateColumns: "minmax(0, 1fr)",
      },
      split: {
        gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
        "@md": {
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
        },
      },
    },
    align: {
      start: { alignItems: "flex-start" },
      center: { alignItems: "center" },
    },
  },

  defaultVariants: {
    layout: "single",
    align: "start",
  },
});
