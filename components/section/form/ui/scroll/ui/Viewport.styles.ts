import { styled } from "@/stitches.config";
export const Viewport = styled("div", {
  position: "relative",
  padding: 0,
  scrollBehavior: "smooth",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    width: 0,
    height: 0,
  },
  variants: {
    scrollable: {
      true: {
        height: "100%",
        overflowY: "auto",
      },
      false: {
        height: "auto",
        overflowY: "visible",
      },
    },
  },
  defaultVariants: {
    scrollable: true,
  },
});
