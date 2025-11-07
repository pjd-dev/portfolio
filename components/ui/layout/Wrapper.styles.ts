import { styled } from "@/stitches.config";

export const Wrapper = styled("main", {
  position: "relative",
  height: "calc(100% - var(--footer-height))",
  display: "flex",
  variants: {
    layout: {
      landing: {
        padding: "0 1rem",
        "@md": { padding: "0 2rem" },
        "@lg": { padding: "0 3rem" },
      },
      legal: {
        justifyContent: "center",
        padding: "0.5rem 0.5rem 0 0.5rem",
        "@md": { padding: "1.5rem  1.5rem 0 1.5rem" },
        "@lg": { padding: "2rem 2rem 0 2rem" },
      },
    },
  },
  defaultVariants: {
    layout: "landing",
  },
});
