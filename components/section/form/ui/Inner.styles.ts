import { styled } from "@/stitches.config";

export const Inner = styled("div", {
  // background: "white",
  glass: true,
  borderRadius: "22px",
  padding: "3rem",

  "@media (max-width: 768px)": {
    padding: "2rem 1.5rem",
  },
});
